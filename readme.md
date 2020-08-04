# Loop Development Kit (LDK) for NodeJS

The LDK is a plugin system for Sidekick. The LDK is built with [go-plugin](https://github.com/hashicorp/go-plugin), a HashiCorp plugin system used in several of their projects.

Plugins developed with this library are executed by Sidekick as separate processes. This ensures that crashes or instability in the plugin will not destabilize the Sidekick process.

Communication between Sidekick and the plugin is first initialized over stdio and then performed using [GRPC](https://grpc.io/). On mac and linux the GRPC communication is sent over unix domain socket and on windows over local TCP socket.
>NOTE: Currently, communication from Sidekick to the plugin, takes place over local TCP socket on mac and linux. Communication from the plugin back to Sidekick still takes place over unix domain socket. This is due to a limitation of the GRPC libraries for NodeJS and will hopefully be fixed in the future.

In order for Sidekick to use a plugin, it must be compiled. Sidekick does not compile or interpret source code at runtime. A consequence of this is that plugins will need to be compiled for each operating system that they want to support. We recommend using [PKG](https://www.npmjs.com/package/pkg) to compile NodeJS plugins into an executable.

## Installation

Add the dependency to your package.json under the dependencies:

```json
"dependencies": {
  "ldk": "git+https://github.com/open-olive/loop-development-kit-node.git"
}
```

Install using NPM

```shell
npm i
```

## Terminology

**Loop** - A concept that describes how Intelligences, Sensors, and Controllers work together to provide useful information to the user.

**Intelligence** - A concept describing a source of information. This includes json files, databases, APIs, and more.

**Sensor** - A Sidekick plugin that emits events. For example, the clipboard sensor emits an event every time the clipboard contents change.

**Controller** - A Sidekick plugin that receives events from Sensors and emits whispers.

**Whisper** - A notification emitted by controllers and displayed in the Sidekick sidebar.

## Sensor

A Sensor is a type of plugin that generates events.  Events can be as simple as a chunk of text but allow for complicated information. Sensors do not choose which controllers get their events. They are simply emitting the events. The decision about which events to use is left to the controller.

### Examples

Bitbucket examples are currently private and only viewable by Olive employees.

* [Basic Sensor Example](https://github.com/open-olive/sidekick-sensor-examplenode) - Recommend using as a starting point for new Sensors.
* [Filesystem Watch Sensor](https://bitbucket.org/crosschx/sidekick-sensor-watchfolder)

### Class

Writing a Sensor plugin boils down to writing a class with the following methods.

```javascript
class Sensor {
  start(host, metadata) {}
  stop() {}
  onEvent() {
}
```

**Start** - The Sensor should wait to start operating until this is called. The provided `SensorHost` should be stored in memory for continued use.

**Stop** - The Sensor should stop operating when this is called.

**OnEvent** - The sensor can use this to handle events from the Sidekick UI. Many sensors will not care about UI events, and in that case the function should just return `nil`.

### Sensor Lifecycle

1. Sidekick executes plugin process
1. Sidekick calls `Start`, sending the host connection information to the plugin. This connection information is used to create the `SensorHost`. The `SensorHost` interface allows the plugin to emit events.
1. On Sensor wanting to emit an event, the Sensor calls the `EmitEvent` method on the host interface.
1. On Sidekick UI event, Sidekick calls `OnEvent`, passing the event to the Sensor. These events can be ignore or used at the Sensor's choice.
1. On User disabling the Sensor, Sidekick calls `Stop` then sends `sigterm` to the process.
1. On Sidekick shutdown, Sidekick calls `Stop` then sends `sigterm` to the process.

## Controller

Controllers receive events and use them to generate relevant whispers. Controllers choose which events they want to use and which they want to ignore.

### Controller Examples

Bitbucket examples are currently private and only viewable by Olive employees.

* [Basic Controller Example](https://github.com/open-olive/sidekick-controller-examplenode) - Recommend using as a starting point for new Controllers.
* [Giphy Controller](https://bitbucket.org/crosschx/sidekick-controller-giphy)

### Controller Class

Writing a Controller plugin boils down to writing a class with the following methods.

```javascript
class Controller {
  start(host, metadata) {}
  stop() {}
  onEvent() {
}
```

**Start** - The Controller should wait to start operating until this is called. The provided `ControllerHost` should be stored in memory for continued use.

**Stop** - The Controller should stop operating when this is called.

**OnEvent** - The controller can use this to handle events that are broadcast by Sensors. Controllers do not need to emit events in a 1:1 relationship with events. Controllers may not use events at all. Controllers may only use some events. Controllers may keep a history of events and only emit whispers when several conditions are met.

### Controller Lifecycle

1. Sidekick executes plugin process
1. Sidekick calls `Start`, sending the host connection information to the plugin. This connection information is used to create the `ControllerHost`. The `ControllerHost` interface allows the plugin to emit whispers.
1. On Controller wanting to emit a whisper, the Controller calls the `EmitWhisper` method on the host interface.
1. On Sensor event, Sidekick calls `OnEvent`, passing the event from the Sensor to the Controller. These events can be ignored or used at the Controller's choice.
1. On User disabling the Controller, Sidekick calls `Stop` then sends `sigterm` to the process.
1. On Sidekick shutdown, Sidekick calls `Stop` then sends `sigterm` to the process.

## Persistent Storage

The host object provided to the plugin through `Start` provides the plugin with methods it can use for storing information.

### Persistent Storage - Applications

* Storing credentials provided by the user.
* Keeping track of data across restarts.

### Persistent Storage - Documentation

In order for a plugin to use storage, the plugin must first provide Sidekick with documentation. This is accomplished by including a new file `storage.json` with your plugin. The following is example documentation for a single entry.

```json
{
 "period": {
   "name": "Period",
   "description": "The time the sensor waits between sending example events"
  }
}
```

*NOTE* If the plugin attempts to access a key that is not documented, the request will be rejected.

### Persistent Storage - Methods

A method for removing the value of a key.

```javascript
storageDelete(key) => Promise
```

A method for removing the values of all documented keys.

```javascript
storageDeleteAll() => Promise
```

A method for checking if a value has been set for a key.

```javascript
storageHasKey(key) => Promise
```

A method for listing all documented keys.

```javascript
storageKeys() => Promise
```

A method for getting the value of a key.

```javascript
storageRead(key) => Promise
```

A method for getting the values of all documented keys.

```javascript
storageReadAll() => Promise
```

A method for setting the value of a key.

```javascript
storageWrite(key, value) => Promise
```
