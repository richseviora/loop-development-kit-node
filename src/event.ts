/**
 * @typedef event
 * @type {object}
 * @property {object} data - The content of the event.
 * @example
 * {
 *   data: {
 *     text: "this is an example event with just a text field"
 *   },
 * }
 */
interface event {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { [index: string]: any };
}
