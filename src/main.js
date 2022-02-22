import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import mkdirp from 'mkdirp';
import { projectInstall } from 'pkg-install';
const access = promisify(fs.access);
const copy = promisify(ncp);
// 递归拷贝文件
async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}
async function initGit(options) {
  // 执行 git init
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}
// 创建项目
export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.projectName || process.cwd(),
  };
  const projectDir = path.resolve(process.cwd(), options.projectName)
  try {
    // 判断项目目录是否存在
    const exists = fs.existsSync(projectDir);
    if (exists) {
      console.error('%s project directory exists please use another name!', chalk.red.bold('ERROR'));
      return process.exit(1);
    }
    mkdirp.sync(projectDir)
    console.log(`create directory: ${projectDir}`)
  } catch (err) {
    console.log(err)
  }
  const currentFileUrl = import.meta.url;
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    '../../templates',
    options.template.toLowerCase()
  );
  options.templateDirectory = templateDir;
  try {
    // 判断模板是否存在
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    // 模板不存在 
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }
  // 声明 tasks
  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Initialize git',
      task: () => initGit(options),
      enabled: () => options.git,
    },
    {
      title: 'Install dependencies',
      task: () =>
        projectInstall({
          cwd: options.targetDirectory,
        }),
      skip: () =>
        !options.runInstall
          ? 'Pass --install to automatically install dependencies'
          : undefined,
    },
  ]);
  // 并行执行 tasks
  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  console.log(`%s cd ${options.projectName} && yarn dev`, chalk.green.bold('DONE'))
  return true;
}