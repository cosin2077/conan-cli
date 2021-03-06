import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createProject } from './main';
import * as fs from 'fs';
import * as path from 'path';

const validateTemplate = (templatePath) => {
  return fs.existsSync(templatePath)
          && fs.statSync(templatePath).isDirectory()
            && fs.existsSync(path.resolve(templatePath, 'package.json'))
}
const parseTemplates = () => {
  let templates = fs.readdirSync(path.resolve(__dirname, '../templates'))
  templates = templates.filter((dir) => validateTemplate(path.resolve(__dirname, '../templates', dir)))
  return templates
}
// 解析命令行参数为 options
function parseArgumentsIntoOptions(rawArgs) {
  // 使用 arg 进行解析
  const args = arg(
    {
      '--git': Boolean,
      '--yes': Boolean,
      '--install': Boolean,
      '--typescript': Boolean,
      '-g': '--git',
      '-y': '--yes',
      '-i': '--install',
      '-t': '--typescript',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    skipPrompts: args['--yes'] || false,
    git: args['--git'] || false,
    projectName: args._[0],
    runInstall: args['--install'] || false,
    typescript: args['--typescript'] || false,
    template: args['--template'] || '',
  }
}
async function promptForMissingOptions(options) {
  try {
    const exists = fs.existsSync(options.projectName);
    if (exists) {
      console.error('%s project directory exists please use another name!', chalk.red.bold('ERROR'));
      return process.exit(1);
    }
  } catch (err) {
    console.log(err)
    return process.exit(1);
  }
  // 默认使用名为 JavaScript 的模板
  const templates = parseTemplates();
  const defaultTemplate = templates[0];
  // 使用默认模板则直接返回
  if (options.skipPrompts) {
    return {
      ...options,
      template: options.template || defaultTemplate,
    };
  }
  // 准备交互式问题 
  const questions = [];
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Please choose which project template to use',
      choices: templates,
      default: defaultTemplate,
    });
  }
  if (!options.git) {
    questions.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize a git repository?',
      default: false,
    });
  }
  if (!options.typescript) {
    questions.push({
      type: 'confirm',
      name: 'typescript',
      message: 'Do you use Typescript?',
      default: false,
    });
  }
  // 使用 inquirer 进行交互式查询，并获取用户答案选项
  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    template: options.template || answers.template,
    typescript: options.typescript || answers.typescript,
    git: options.git || answers.git,
  };
}
export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}