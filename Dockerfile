# Multi-stage build for Spring Boot
FROM maven:3.8.4-openjdk-17-slim AS build

# Set working directory
WORKDIR /app

# Copy backend files
COPY ws/pom.xml .
COPY ws/src src

# Build the application with Maven directly
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre

# Set working directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads/profile uploads/attachment

# Copy JAR file
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE $PORT

# Run the application
CMD ["java", "-jar", "-Dspring.profiles.active=production", "app.jar"] 