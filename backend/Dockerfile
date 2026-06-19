FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY settings.xml .
COPY pom.xml .
RUN mvn -s settings.xml dependency:go-offline -B

COPY src ./src
RUN mvn -s settings.xml package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]

