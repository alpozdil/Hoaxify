# Multi-stage build
# Stage 1: Build the application
FROM maven:3.8.4-openjdk-17-slim AS build

# Set working directory
WORKDIR /app

# Copy Maven files first for better layer caching
COPY pom.xml .
COPY src src

# Build the application with Maven directly
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre

# Set working directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads/profile uploads/attachment

# Copy the JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=production

# Run the application
CMD ["java", "-jar", "app.jar"] 