# Multi-stage build for static site with nginx
FROM nginx:alpine AS production

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static site files
COPY src/ /usr/share/nginx/html/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
