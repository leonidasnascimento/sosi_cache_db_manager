const redis = require("redis")
const cacheDbConfig = require("./cacheDbConfig")
const responseMessage = require("./responseMessage")

class CacheDbManager {
    constructor(_key) {
        this.client = null
        this.isServerOn = true
        this.keyExists = true
        this.key = _key
    }

    createCacheDbClient(skipKeyChecking = false) {
        try {

            this.client = redis.createClient({
                host: cacheDbConfig.host,
                no_ready_check: false,
                auth_pass: cacheDbConfig.password,
                port: cacheDbConfig.port
            });

            this.client.on('error', function (err) {
                responseMessage.serverOn = false
                responseMessage.message = "Error"
                responseMessage.data = err
            });

            this.client.on('connect', function (err) {
                responseMessage.serverOn = true
            });

            if (skipKeyChecking) {
                responseMessage.keyFound = true
            } else {
                this.client.exists(this.key, function (err, reply) {
                    if (reply === 1) {
                        responseMessage.keyFound = true
                    } else {
                        responseMessage.keyFound = false
                    }
                });
            }

            if (!(this.isServerOn && this.keyExists)) {
                return false
            } else {
                return true
            }
        } catch (error) {
            responseMessage.message = "Fail while executing 'createCacheDbClient' method. See 'data' property for more details..."
            responseMessage.data = error.message

            if (responseMessage.serverOn) {
                this.client.end(client.connection_id)
            }

            return false
        }
    }

    getValue(onSuccess, onError) {
        try {
            if (this.createCacheDbClient()) {
                this.client.get(this.key, function (err, reply) {
                    responseMessage.data = (!(reply === undefined) && (reply !== "")) ? reply : null
                    responseMessage.message = (!(reply === undefined) && (reply !== "")) ? "Data was retrieved from Cache Server" : "Result not found"

                    onSuccess(responseMessage)
                })

                this.client.quit()
            } else {
                onError(responseMessage)

                if (responseMessage.serverOn) {
                    this.client.end(this.client.connection_id)
                }
            }
        } catch (error) {
            responseMessage.data = null
            responseMessage.message = error.message

            onError(responseMessage)

            if (responseMessage.serverOn) {
                this.client.end(this.client.connection_id)
            }
        }
    }

    setValue(obj, onSuccess, onError) {
        try {
            if (this.createCacheDbClient(true)) {
                var str_obj = JSON.stringify(obj)
                this.client.set(this.key, str_obj, function (err, reply) {
                    if (reply === "OK") {
                        responseMessage.message = "Data was successfully set to key '" + this.key + "' as the server sent '" + reply + "'"
                        responseMessage.data = str_obj

                        onSuccess(responseMessage)
                    } else {
                        throw err
                    }
                })

                this.client.quit()
            } else {
                onError(responseMessage)

                if (responseMessage.serverOn) {
                    this.client.end(client.connection_id)
                }
            }
        } catch (error) {
            responseMessage.data = null
            responseMessage.message = error.message

            onError(responseMessage)

            if (responseMessage.serverOn) {
                this.client.end(client.connection_id)
            }
        }
    }
}

module.exports = CacheDbManager