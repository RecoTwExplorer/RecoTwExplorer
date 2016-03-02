// Compiled using typings@0.6.8
// Source: node_modules/gulpclass/index.d.ts
declare module 'gulpclass/TaskMetadata' {
	/**
	 * Metadata of the Task annotation.
	 */
	export interface TaskMetadata {
	    /**
	     * Object that is called by this task.
	     */
	    classConstructor: Function;
	    /**
	     * Method called by this class.
	     */
	    method: string;
	    /**
	     * Task name.
	     */
	    name: string;
	    /**
	     * Indicates if this task will be run using run-sequence component.
	     */
	    isSequence?: boolean;
	    /**
	     * Indicates if this task will be run using merge2 component.
	     */
	    isMerge?: boolean;
	}

}
declare module 'gulpclass/GulpclassMetadata' {
	/**
	 * Metadata of the Gulpclass annotation.
	 */
	export interface GulpclassMetadata {
	    gulpInstance: any;
	    classConstructor: Function;
	    classInstance?: Object;
	}

}
declare module 'gulpclass/MetadataStorage' {
	import { TaskMetadata } from 'gulpclass/TaskMetadata';
	import { GulpclassMetadata } from 'gulpclass/GulpclassMetadata';
	/**
	 * Storages and registers all gulp classes and their tasks.
	 */
	export class MetadataStorage {
	    private gulpclassMetadatas;
	    private taskMetadatas;
	    addGulpclassMetadata(metadata: GulpclassMetadata): void;
	    addTaskMetadata(metadata: TaskMetadata): void;
	    private registerTasks(gulpclassMetadata, taskMetadata);
	}
	/**
	 * Default metadata storage is used as singleton and can be used to storage all metadatas.
	 */
	export let defaultMetadataStorage: MetadataStorage;

}
declare module 'gulpclass/Decorators' {
	/**
	 * Registers a class from which tasks will be loaded.
	 * You can optionally specify your gulp instance if you want to register tasks specifically there.
	 */
	export function Gulpclass(gulpInstance?: any): Function;
	/**
	 * Registers a task with the given name. If name is not specified then object's method name will be used.
	 */
	export function Task(name?: string): Function;
	/**
	 * Tasks will be run in sequence when using this annotation.
	 */
	export function SequenceTask(name?: string): Function;
	/**
	 * Tasks will be run merged when using this annotation.
	 */
	export function MergedTask(name?: string): Function;

}