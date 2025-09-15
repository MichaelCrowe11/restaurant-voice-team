import chalk from 'chalk';

export class Logger {
  static log(level, message, context = '') {
    const timestamp = new Date().toISOString();
    const contextStr = context ? chalk.gray(`[${context}]`) : '';

    switch (level) {
      case 'info':
        console.log(`${chalk.blue('ℹ')} ${chalk.gray(timestamp)} ${contextStr} ${message}`);
        break;
      case 'success':
        console.log(`${chalk.green('✓')} ${chalk.gray(timestamp)} ${contextStr} ${message}`);
        break;
      case 'warning':
        console.log(`${chalk.yellow('⚠')} ${chalk.gray(timestamp)} ${contextStr} ${message}`);
        break;
      case 'error':
        console.log(`${chalk.red('✗')} ${chalk.gray(timestamp)} ${contextStr} ${message}`);
        break;
      case 'debug':
        console.log(`${chalk.magenta('🔍')} ${chalk.gray(timestamp)} ${contextStr} ${message}`);
        break;
      default:
        console.log(`${chalk.gray(timestamp)} ${contextStr} ${message}`);
    }
  }

  static info(message, context) {
    this.log('info', message, context);
  }

  static success(message, context) {
    this.log('success', message, context);
  }

  static warning(message, context) {
    this.log('warning', message, context);
  }

  static error(message, context) {
    this.log('error', message, context);
  }

  static debug(message, context) {
    this.log('debug', message, context);
  }
}