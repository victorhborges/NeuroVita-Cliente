FROM node:22-alpine AS frontend-build

WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build -- --configuration production

FROM maven:3.9-eclipse-temurin-21-alpine AS backend-build

WORKDIR /workspace
COPY backend/ ./backend/
COPY --from=frontend-build /workspace/frontend/dist/neurovita/browser/ ./backend/src/main/resources/static/
RUN chmod +x ./backend/mvnw \
    && ./backend/mvnw -f ./backend/pom.xml -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app
COPY --from=backend-build /workspace/backend/target/*.jar ./app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
