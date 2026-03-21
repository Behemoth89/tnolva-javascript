# Use a lightweight web server image
FROM nginx:latest

# Copy the static files to the nginx default public directory
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
