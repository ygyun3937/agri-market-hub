FROM mcr.microsoft.com/dotnet/runtime-deps:10.0
WORKDIR /app
COPY publish/ .
RUN chmod +x AgriHub.Api
ENTRYPOINT ["./AgriHub.Api"]
