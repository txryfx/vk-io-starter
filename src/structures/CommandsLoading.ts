import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from '../logger';
import BaseButton from './BaseButton';
import BaseCommand from './BaseCommand';
import VKClient, { VKClientPaths } from './VKClient';

type LoadSummary = {
  loaded: number;
  duplicates: number;
  errors: number;
};

export default class CommandsLoading {
  private readonly client: VKClient;
  private readonly paths: VKClientPaths;

  constructor(client: VKClient, paths: VKClientPaths) {
    this.client = client;
    this.paths = paths;
  }

  async init() {
    logger.info('[commands] init loader');
    const commands = await this.reloadCommands(false);
    const buttons = await this.reloadButtons(false);
    logger.info(`[commands] loaded: commands=${commands.loaded}, buttons=${buttons.loaded}`);
  }

  async reloadCommands(bustCache = true): Promise<LoadSummary> {
    const commandsDir = await this.resolveDir(this.paths.commands);
    if (!commandsDir) {
      logger.warn(`[commands] directory not found: ${this.paths.commands}`);
      return { loaded: 0, duplicates: 0, errors: 0 };
    }

    const files = await this.collectFiles(commandsDir);
    const seen = new Set<string>();
    let loaded = 0;
    let duplicates = 0;
    let errors = 0;

    this.client.resetCommands();
    for (const file of files) {
      try {
        const imported = await this.importModule(file, bustCache);
        const command: BaseCommand | undefined = imported?.default;
        if (!command) continue;

        const name = command.data?.name?.toLowerCase();
        if (!name) continue;

        if (seen.has(name)) {
          duplicates++;
          continue;
        }
        seen.add(name);
        this.client.registerCommand(name, command);
        loaded++;
      } catch (error) {
        errors++;
        logger.error(`[commands] failed to load ${file}`, error);
      }
    }

    this.client.setCommandsInitialized(true);
    return { loaded, duplicates, errors };
  }

  async reloadButtons(bustCache = true): Promise<LoadSummary> {
    const buttonsDir = await this.resolveDir(this.paths.buttons);
    if (!buttonsDir) {
      logger.warn(`[buttons] directory not found: ${String(this.paths.buttons)}`);
      return { loaded: 0, duplicates: 0, errors: 0 };
    }

    const files = await this.collectFiles(buttonsDir);
    const seen = new Set<string>();
    let loaded = 0;
    let duplicates = 0;
    let errors = 0;

    this.client.resetButtons();
    for (const file of files) {
      try {
        const imported = await this.importModule(file, bustCache);
        const button: BaseButton | undefined = imported?.default;
        if (!button) continue;

        const name = button.data?.name?.toLowerCase();
        if (!name) continue;

        if (seen.has(name)) {
          duplicates++;
          continue;
        }
        seen.add(name);
        this.client.registerButton(name, button);
        loaded++;
      } catch (error) {
        errors++;
        logger.error(`[buttons] failed to load ${file}`, error);
      }
    }

    return { loaded, duplicates, errors };
  }

  private async resolveDir(input?: string): Promise<string | null> {
    if (!input) return null;
    let dir = path.resolve(input);
    let exists = await fs.readdir(dir).catch(() => null);

    if (!exists) {
      const distPath = dir.replace(`${path.sep}src${path.sep}`, `${path.sep}dist${path.sep}`);
      dir = distPath;
      exists = await fs.readdir(dir).catch(() => null);
    }

    return exists ? dir : null;
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.collectFiles(fullPath);
        files.push(...nested);
        continue;
      }

      if (entry.name.endsWith('.d.ts')) {
        continue;
      }

      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.js')) {
        continue;
      }

      files.push(fullPath);
    }

    return files;
  }

  private async importModule(file: string, bustCache: boolean): Promise<any> {
    const url = pathToFileURL(file).href;
    const importUrl = bustCache ? `${url}?update=${Date.now()}` : url;
    return import(importUrl);
  }
}
