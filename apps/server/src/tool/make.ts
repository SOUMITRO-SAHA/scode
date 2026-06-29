import * as bashModule from "./bash";
import { Tool } from "./core";
import type { AnyTool } from "./core";
import * as editModule from "./edit";
import * as globModule from "./glob";
import * as grepModule from "./grep";
import * as readModule from "./read";
import * as skillModule from "./skill";
import * as writeModule from "./write";

export { Tool, runTool } from "./core";
export type { AnyTool } from "./core";

export const read: AnyTool = readModule.tool;
export const write: AnyTool = writeModule.tool;
export const edit: AnyTool = editModule.tool;
export const bash: AnyTool = bashModule.tool;
export const grep: AnyTool = grepModule.tool;
export const glob: AnyTool = globModule.tool;
export const skill: AnyTool = skillModule.tool;

/** All built-in tools */
export const allTools: AnyTool[] = [read, write, edit, bash, grep, glob, skill];
