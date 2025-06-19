#!/bin/bash
cd ws
./mvnw clean package -DskipTests
java -jar -Dspring.profiles.active=production target/*.jar 