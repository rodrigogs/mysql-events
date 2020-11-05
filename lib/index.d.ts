import { Connection } from "mysql";

/**
 * By default, all events and schema are emitted.
 * excludeSchema and excludeEvents take precedence over includeSchema and includeEvents, respectively.
 */
export declare type ZongjiOptions = {
	/**
	 * To identify this replication slave instance. Must be specified if running more than one instance of ZongJi. Must be used in start() method for effect.
	 * Default: 1
	 */
	serverId?: number
	/**
	 * Pass true to only emit binlog events that occur after ZongJi's instantiation. Must be used in start() method for effect.
	 * Default: false
	 */
	startAtEnd?: boolean,
	/**
	 * Begin reading events from this binlog file. If specified together with binlogNextPos, will take precedence over startAtEnd.
	 */
	binlogName?: string,
	/**
	 * Begin reading events from this position. Must be included with binlogName.
	 */
	binlogNextPos?: number,
	/**
	 * Array of event names to include
	 * Example: ['writerows', 'updaterows', 'deleterows']
	 */
	includeEvents?: string[],
	/**
	 * Array of event names to exclude
	 * Example: ['rotate', 'tablemap']
	 */
	excludeEvents?: string[],
	/**
	 * Object describing which databases and tables to include (Only for row events). Use database names as the key and pass an array of table names or true (for the entire database).
	 * Example: { 'my_database': ['allow_table', 'another_table'], 'another_db': true }
	 */
	includeSchema?: Record<string, (boolean | string[])>
	/**
	 * Object describing which databases and tables to exclude (Same format as includeSchema)
	 * Example: { 'other_db': ['disallowed_table'], 'ex_db': true }
	 */
	excludeSchema?: Record<string, (boolean | string[])>
}

export declare type Trigger = {
	name: string,
	/**
	 * The expression argument is very dynamic, you can replace any step by * to make it wait for any schema, table or column events
	 */
	expression: string,
	/**
	 * The statement argument indicates in which database operation an event should be triggered
	 * Default: ALL
	 */
	statement?: string
}

export declare type AddTrigger = {
	/**
	 * A function where the trigger events should be handled
	 */
	onEvent?: (event: EventType) => Promise<void> | void
} & Trigger

/**
 * Before and after have same property names.  (before not available on insert!)
 */
export declare type AffectedRow = {
	before: any,
	after: any
}

export declare type EventType = {
	type: 'UPDATE' | 'INSERT' | 'DELETE'
	schema: string
	table: string
	binlogName: string
	nextPosition: number
	/**
	 * Epoch millis
	 */
	timestamp: number
	affectedRows: [AffectedRow]
	affectedColumns: string[]
}

export declare type Statements = {
	ALL: 'ALL'
	INSERT: 'INSERT'
	UPDATE: 'UPDATE'
	DELETE: 'DELETE'
}

export declare type Events = {
	STARTED: 'started'
	STOPPED: 'stopped'
	PAUSED: 'paused'
	RESUMED: 'resumed'
	BINLOG: 'binlog'
	TRIGGER_ERROR: 'triggerError'
	CONNECTION_ERROR: 'connectionError'
	ZONGJI_ERROR: 'zongjiError'
}

export declare type DSN = {
	host: string,
	user: string,
	password: string
}

export default class MySQLEvents /* extends EventEmitter, but it's a dependency not peer, so leaving like this. */ {

	static STATEMENTS: Readonly<Statements>
	static EVENTS: Readonly<Events>

	constructor(connection: Connection | DSN, options: ZongjiOptions);
	
	/**
	 * Adds a trigger for the given expression/statement and calls the onEvent function when the event happens
	 */
	addTrigger: (trigger: AddTrigger) => void
	/**
	 * The name argument must be unique for each expression/statement, it will be user later if you want to remove a trigger
	 */
	removeTrigger: (trigger: Trigger) => void
	/**
	 * Start receiving replication events, see options listed below.
	 * When options are passed they will Object.assign what you passed into the constructor.
	 */
	start: (options?: ZongjiOptions) => Promise<void>
	/**
	 * pauses MySQL connection until #resume() is called, this it useful when you're receiving more data than you can handle at the time
	 */
	pause: () => void
	/**
	 * resumes a paused MySQL connection, so it starts to generate binlog events again
	 */
	resume: () => void
	/**
	 * Disconnect from MySQL server, stop receiving events
	 */
	stop: () => Promise<void>
	/**
	 * Change options after start()
	 */
	set: (options: Partial<ZongjiOptions>) => void
	/**
	 * Add a listener to the binlog or error event. Each handler function accepts one argument.
	 */
	on: (event: string, eventHandler: (...data: any[]) => void) => void
}