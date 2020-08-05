const services = require('./proto/ldk_grpc_pb');
const { prepareLogging } = require('./logging');

const BrokerGrpcServer = require('./brokerGrpcServer');
const {
  HealthGrpcServer,
  HealthService,
} = require('./healthGrpcServer');
const SensorGRPCServer = require('./sensorGrpcServer');
const {
  StdioGrpcServer,
  StdioService,
} = require('./stdioGrpcServer');

/**
 * @typedef sensorImplementation
 * @type {object}
 * @property {Function} start - Executed when the host starts the plugin.
 * The plugin should not do anything before this is called.
 * @param {SensorGrpcHostClient} host
 * @property {Function} stop - Executed by the host to stop the plugin.
 * All plugin activity should stop when this is called.
 * @property {Function} onEvent - The host will send events to the plugin by calling this function.
 * @param {event} event
 */

/** Class used to setup the GRPC server and host the sensor service. */
class SensorPlugin {
  constructor(impl) {
    this.server = new services.grpc.Server();
    this.broker = new BrokerGrpcServer(this.server);
    this.server.addService(HealthService, new HealthGrpcServer());
    this.server.addService(StdioService, new StdioGrpcServer());
    this.sensor = new SensorGRPCServer(this.server, impl, this.broker);
  }

  /**
   * Run the GRPC server and write connection information to stdout.
   *
   * @async
   * @returns {void}
   */
  serve() {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        '127.0.0.1:0',
        services.grpc.ServerCredentials.createInsecure(),
        (err, port) => {
          if (err) {
            reject(err);
          }
          this.server.start();
          process.stdout.write(`1|1|tcp|127.0.0.1:${port}|grpc\n`);
          prepareLogging();
          resolve();
        }
      );
    });
  }
}

module.exports = SensorPlugin;
