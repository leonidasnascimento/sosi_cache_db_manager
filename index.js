const redis = require("redis")
const cacheDbConfig = require("./cacheDbConfig")
const responseMessage = require("./responseMessage")

class CacheDbManager {
    client = null
    keyExists = true
    isServerOn = true
    key = ""

    constructor(_key){
        this.client = null
        this.isServerOn = true
        this.keyExists = true
        this.key = _key
    }

    createCacheDbClient(skipKeyChecking = false) {
        try {
            client = redis.createClient({
                host: cacheDbConfig.host,
                no_ready_check: false,
                auth_pass: cacheDbConfig.password,
                port: cacheDbConfig.port
            });

            client.on('error', function (err) {
                responseMessage.serverOn = false
                responseMessage.message = "Error"
                responseMessage.data = err
            });

            client.on('connect', function (err) {
                responseMessage.serverOn = true
            });

            if (skipKeyChecking) {
                responseMessage.keyFound = true
            } else {
                client.exists(this.key, function (err, reply) {
                    if (reply === 1) {
                        responseMessage.keyFound = true
                    } else {
                        responseMessage.keyFound = false
                    }
                });
            }

            if (!(isServerOn && keyExists)) {
                return false
            } else {
                return true
            }
        } catch (error) {
            responseMessage.message = "Exception"
            responseMessage.data = error

            if (responseMessage.serverOn) {
                client.end(client.connection_id)
            }

            return false
        }
    }

    getValue(onSuccess, onError) {
        try {
            if (this.createCacheDbClient()) {
                client.get(this.key, function (err, reply) {
                    responseMessage.data = (!(reply === undefined) && (reply !== "")) ? reply : null
                    responseMessage.message = (!(reply === undefined) && (reply !== "")) ? "Data was retrieved from Redis Cache Server" : "Result not found"

                    onSuccess(responseMessage)
                    client.quit()
                })
            } else {
                onError(responseMessage)

                if (responseMessage.serverOn) {
                    client.end(client.connection_id)
                }
            }
        } catch (error) {
            responseMessage.data = null
            responseMessage.message = error

            onError(responseMessage)

            if (responseMessage.serverOn) {
                client.end(client.connection_id)
            }
        }
    }

    setValue(obj, onSuccess, onError) {
        try {
            if (this.create_redis_client(true)) {
                var str_obj = JSON.stringify(obj)
                client.set(this.key, str_obj, function (err, reply) {
                    if (reply === "OK") {
                        responseMessage.message = "Data was successfully set to key '" + this.key + "' as the server sent '" + reply + "'"
                        responseMessage.data = str_obj

                        onSuccess(responseMessage)
                        client.quit()
                    } else {
                        throw err
                    }
                })
            } else {
                onError(responseMessage)

                if (responseMessage.serverOn) {
                    client.end(client.connection_id)
                }
            }
        } catch (error) {
            responseMessage.data = null
            responseMessage.message = error

            onError(responseMessage)

            if (responseMessage.serverOn) {
                client.end(client.connection_id)
            }
        }
    }
}

module.exports = CacheDbManager