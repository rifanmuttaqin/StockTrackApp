import axios from 'axios';

// API request caching
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request deduplication
const pendingRequests = new Map();

// Optimized axios instance with caching
export const createOptimizedAxios = () => {
  const instance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  // Request interceptor for caching
  instance.interceptors.request.use(config => {
    const cacheKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;

    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      return Promise.reject(new Error('Request already pending'));
    }

    // Mark request as pending
    pendingRequests.set(cacheKey, true);

    return config;
  });

  // Response interceptor for caching
  instance.interceptors.response.use(
    response => {
      const cacheKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params)}`;

      // Cache successful GET requests
      if (response.config.method === 'get' && response.status === 200) {
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }

      // Clear pending request
      pendingRequests.delete(cacheKey);

      return response;
    },
    error => {
      // Clear pending request on error
      if (error.config) {
        const cacheKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params)}`;
        pendingRequests.delete(cacheKey);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Cached API request function
export const cachedApiCall = async (method, url, config = {}) => {
  const cacheKey = `${method}-${url}-${JSON.stringify(config.params)}`;

  // Check cache for GET requests
  if (method === 'get') {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { data: cached.data, fromCache: true };
    }
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return new Promise((resolve, reject) => {
      const checkPending = () => {
        if (!pendingRequests.has(cacheKey)) {
          cachedApiCall(method, url, config).then(resolve).catch(reject);
        } else {
          setTimeout(checkPending, 100);
        }
      };
      checkPending();
    });
  }

  // Make new request
  const api = createOptimizedAxios();
  try {
    const response = await api[method](url, config);
    return { data: response.data, fromCache: false };
  } catch (error) {
    throw error;
  }
};

// Batch API requests
export const batchApiCalls = async (requests) => {
  const api = createOptimizedAxios();
  const promises = requests.map(request => {
    const { method, url, config } = request;
    return api[method](url, config);
  });

  try {
    const responses = await Promise.allSettled(promises);
    return responses.map(response => {
      if (response.status === 'fulfilled') {
        return { success: true, data: response.value.data };
      } else {
        return { success: false, error: response.reason };
      }
    });
  } catch (error) {
    throw error;
  }
};

// Progressive data loading
export const progressiveLoad = async (url, options = {}) => {
  const {
    initialLimit = 20,
    stepSize = 20,
    maxLimit = 100,
    onProgress
  } = options;

  const results = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore && offset < maxLimit) {
    const limit = Math.min(stepSize, maxLimit - offset);
    const response = await cachedApiCall('get', url, {
      params: { ...options.params, limit, offset }
    });

    if (response.data.length > 0) {
      results.push(...response.data);
      offset += response.data.length;

      if (onProgress) {
        onProgress(results, offset, maxLimit);
      }
    } else {
      hasMore = false;
    }
  }

  return results;
};

// Optimized API wrapper with retry logic
export const optimizedApiCall = async (method, url, config = {}, retries = 3) => {
  const api = createOptimizedAxios();
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await api[method](url, config);
      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      // Exponential backoff
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError;
};

// Request compression
export const compressRequest = (data) => {
  if (typeof data === 'object') {
    return JSON.stringify(data);
  }
  return data;
};

// Response decompression
export const decompressResponse = (data) => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

// Network status monitoring
export const monitorNetworkStatus = (callback) => {
  const updateStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    callback(status);
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  // Initial status
  updateStatus();

  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  };
};

// Connection quality detection
export const getConnectionQuality = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return 'unknown';
  }

  const { effectiveType, downlink, rtt } = connection;

  if (effectiveType === '4g' && downlink > 1.5 && rtt < 100) {
    return 'excellent';
  } else if (effectiveType === '4g' && downlink > 0.5 && rtt < 300) {
    return 'good';
  } else if (effectiveType === '3g' || downlink > 0.1) {
    return 'fair';
  } else {
    return 'poor';
  }
};

// Adaptive loading based on connection
export const adaptiveLoading = (highQualityUrl, lowQualityUrl) => {
  const quality = getConnectionQuality();

  switch (quality) {
    case 'excellent':
    case 'good':
      return highQualityUrl;
    case 'fair':
    case 'poor':
      return lowQualityUrl;
    default:
      return highQualityUrl;
  }
};

// Clear cache utility
export const clearApiCache = () => {
  apiCache.clear();
};

// Cache size monitoring
export const getCacheSize = () => {
  let size = 0;
  apiCache.forEach((value) => {
    size += JSON.stringify(value).length;
  });
  return `${(size / 1024).toFixed(2)} KB`;
};

// Prefetch data for likely user actions
export const prefetchLikelyData = (routes) => {
  const api = createOptimizedAxios();

  routes.forEach(route => {
    // Prefetch with low priority
    api.get(route.url, {
      params: route.params,
      headers: { 'X-Prefetch': 'true' }
    }).catch(() => {
      // Ignore prefetch errors
    });
  });
};

// Optimized pagination
export const optimizedPagination = async (url, page, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  const response = await cachedApiCall('get', url, {
    params: { limit: pageSize, offset }
  });

  return {
    data: response.data,
    page,
    pageSize,
    hasMore: response.data.length === pageSize,
    nextOffset: offset + pageSize
  };
};
