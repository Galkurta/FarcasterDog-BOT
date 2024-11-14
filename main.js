const axios = require("axios");
const fs = require("fs");
const displayBanner = require("./config/banner");
const colors = require("./config/colors");
const CountdownTimer = require("./config/countdown");
const logger = require("./config/logger");

const CONFIG = {
  BASE_URL: "https://api.farcasterdog.xyz/api",
  COOKIE_FILE: "data.txt",
  DELAYS: {
    BETWEEN_REQUESTS: 1000,
    BETWEEN_TASKS: 2000,
    BETWEEN_ACCOUNTS: 5000,
    CHECK_INTERVAL: 300000,
  },
  HEADERS: {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.8",
    "Cache-Control": "no-cache",
    Origin: "https://farcasterdog.xyz",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  },
};

const ENDPOINTS = {
  LOGIN_CHECK: "/login_farquest_dog/check-status",
  USER_INFO: "/user/select",
  POINTS: "/point/select_point_by_fid",
  DAILY_TASKS: "/user/all_task/task_daily",
  MAIN_TASKS: "/user/all_task/task_main",
  CLICK_TASK: "/user/reg_click_status",
  UPDATE_TASK: "/user/task/task_daily/select_updated_task",
  UPDATE_POINTS: "/user/update_point",
};

class FarcasterAccount {
  constructor(cookie, index = 0) {
    this.cookie = cookie;
    this.name = `Account ${index + 1}`;
    this.fid = null;
    this.headers = {
      ...CONFIG.HEADERS,
      Cookie: `token=${cookie}`,
    };
  }
}

class FarcasterBot {
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
    this.accounts = [];
    this.isRunning = false;
    this.loadAccounts();
  }

  loadAccounts() {
    try {
      if (fs.existsSync(CONFIG.COOKIE_FILE)) {
        const cookies = fs
          .readFileSync(CONFIG.COOKIE_FILE, "utf8")
          .split("\n")
          .filter((line) => line.trim())
          .map((cookie, index) => new FarcasterAccount(cookie.trim(), index));

        if (cookies.length === 0) {
          logger.error(
            `${colors.error}No cookies found in data.txt. Please add one cookie per line.${colors.reset}`
          );
          process.exit(1);
        }

        this.accounts = cookies;
      } else {
        fs.writeFileSync(CONFIG.COOKIE_FILE, "");
        logger.error(
          `${colors.error}Created data.txt file. Please add one cookie per line and restart the bot.${colors.reset}`
        );
        process.exit(1);
      }
    } catch (error) {
      logger.error(
        `${colors.error}Error loading accounts: ${error.message}${colors.reset}`
      );
      process.exit(1);
    }
  }

  async makeRequest(method, endpoint, data = null, account) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: account.headers,
        data,
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(
        `${colors.error}Error in request to ${endpoint}: ${error.message}${colors.reset}`
      );
      return null;
    }
  }

  async checkLoginStatus(account) {
    try {
      const response = await this.makeRequest(
        "GET",
        ENDPOINTS.LOGIN_CHECK,
        null,
        account
      );
      const isLoggedIn = response && response.status === true;
      if (isLoggedIn) {
        logger.success(`${colors.success}Login successful${colors.reset}`);
      }
      return isLoggedIn;
    } catch (error) {
      logger.error(
        `${colors.error}Login failed: ${error.message}${colors.reset}`
      );
      return false;
    }
  }

  displayAccountInfo(userInfo, account) {
    logger.info(`${colors.info}Account Information${colors.reset}`);
    logger.info(
      `${colors.info}Account    : ${colors.accountName}${account.name}${colors.reset}`
    );
    logger.info(
      `${colors.info}Username   : ${colors.brightWhite}${userInfo.userName}${colors.reset}`
    );
    logger.info(
      `${colors.info}FID        : ${colors.brightWhite}${userInfo.fid}${colors.reset}`
    );
    logger.info(
      `${colors.info}Age        : ${colors.brightWhite}${userInfo.ageAccount} days${colors.reset}`
    );
    logger.info(
      `${colors.info}Points     : ${colors.brightWhite}${userInfo.Point}${colors.reset}`
    );
    logger.info(
      `${colors.info}Referrals  : ${colors.brightWhite}${userInfo.referralTotal}${colors.reset}`
    );
    logger.info(
      `${colors.info}Followers  : ${colors.brightWhite}${userInfo.followCount}${colors.reset}`
    );
  }

  async initializeAccount(account) {
    try {
      const userInfo = await this.getUser(account);
      if (!userInfo || typeof userInfo.fid === "undefined") {
        throw new Error("Failed to get user info or FID");
      }
      account.fid = String(userInfo.fid);
      this.displayAccountInfo(userInfo, account);
      return true;
    } catch (error) {
      logger.error(
        `${colors.error}Error initializing: ${error.message}${colors.reset}`
      );
      return false;
    }
  }

  async getUser(account) {
    const response = await this.makeRequest(
      "GET",
      ENDPOINTS.USER_INFO,
      null,
      account
    );
    return Array.isArray(response) ? response[0] : response;
  }

  async getPoints(account) {
    const points = await this.makeRequest(
      "POST",
      ENDPOINTS.POINTS,
      { fid: account.fid },
      account
    );
    if (points?.[0]) {
      logger.info(
        `${colors.info}Current points: ${colors.brightWhite}${points[0].Point}${colors.reset}`
      );
    }
    return points;
  }

  async getDailyTasks(account) {
    const tasks = await this.makeRequest(
      "POST",
      ENDPOINTS.DAILY_TASKS,
      { fidId: account.fid, page: 1, limit: 10 },
      account
    );
    logger.info(
      `${colors.info}Found ${tasks?.length || 0} daily tasks${colors.reset}`
    );
    return tasks;
  }

  async getMainTasks(account) {
    const tasks = await this.makeRequest(
      "POST",
      ENDPOINTS.MAIN_TASKS,
      { fidId: account.fid },
      account
    );
    logger.info(
      `${colors.info}Found ${tasks?.length || 0} main tasks${colors.reset}`
    );
    return tasks;
  }

  async clickTask(taskId, taskName, account) {
    const result = await this.makeRequest(
      "POST",
      ENDPOINTS.CLICK_TASK,
      { taskId, fid: account.fid, taskName, clickStatus: null },
      account
    );
    if (result) {
      logger.success(
        `${colors.success}Successfully clicked task: ${taskName}${colors.reset}`
      );
    }
    return result;
  }

  async updateTaskStatus(taskId, account) {
    const response = await this.makeRequest(
      "POST",
      ENDPOINTS.UPDATE_TASK,
      { fidId: account.fid, taskId },
      account
    );
    if (Array.isArray(response) && response.length > 0) {
      const taskInfo = response[0];
      logger.info(
        `${colors.taskInProgress}Task ${taskId} status: ${JSON.stringify(
          taskInfo
        )}${colors.reset}`
      );
      return taskInfo;
    }
    return null;
  }

  async updatePoints(taskId, points, account) {
    const response = await this.makeRequest(
      "POST",
      ENDPOINTS.UPDATE_POINTS,
      { taskId, fid: account.fid, point: points },
      account
    );
    return (
      response?.message?.includes("Update point thành công") ||
      response?.message?.includes("Already inserted previously")
    );
  }

  async processTaskList(tasks, account, taskType) {
    let totalPointsGained = 0;
    logger.info(`${colors.info}Processing ${taskType} Tasks${colors.reset}`);

    for (const task of tasks) {
      const {
        taskId,
        taskName,
        point: taskPoints,
        clickStatus,
        claimStatus,
      } = task;

      logger.info(
        `${colors.taskInProgress}Processing task: ${taskName}${colors.reset}`
      );

      if (claimStatus === 1) {
        logger.info(
          `${colors.taskComplete}Task already claimed${colors.reset}`
        );
        continue;
      }

      const clicked = await this.clickTask(taskId, taskName, account);
      if (clicked) {
        await this.delay(CONFIG.DELAYS.BETWEEN_REQUESTS);

        let shouldClaim = false;
        if (taskType === "daily") {
          const updatedTask = await this.updateTaskStatus(taskId, account);
          shouldClaim = updatedTask?.clickStatus === 1;
        } else {
          shouldClaim = clickStatus === 1 || task.status === 1;
        }

        if (shouldClaim) {
          const pointsUpdated = await this.updatePoints(
            taskId,
            taskPoints || 0,
            account
          );
          if (pointsUpdated) {
            totalPointsGained += taskPoints || 0;
            logger.success(
              `${colors.success}Claimed ${taskPoints || 0} points${
                colors.reset
              }`
            );
          }
        } else {
          logger.warn(
            `${colors.taskWaiting}Task not ready to claim${colors.reset}`
          );
        }

        await this.delay(CONFIG.DELAYS.BETWEEN_TASKS);
      }
    }

    if (totalPointsGained > 0) {
      logger.success(
        `${colors.success}Total points gained from ${taskType} tasks: ${totalPointsGained}${colors.reset}`
      );
    }
  }

  async processTasks(account) {
    logger.info(`${colors.info}Starting Tasks${colors.reset}`);

    const dailyTasks = await this.getDailyTasks(account);
    if (dailyTasks?.length) {
      await this.processTaskList(dailyTasks, account, "daily");
    }

    const mainTasks = await this.getMainTasks(account);
    if (mainTasks?.length) {
      await this.processTaskList(mainTasks, account, "main");
    }

    const points = await this.getPoints(account);
    if (points?.[0]) {
      logger.success(
        `${colors.success}Final points: ${points[0].Point}${colors.reset}`
      );
    }

    logger.info(`${colors.info}Tasks Completed${colors.reset}`);
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async start() {
    displayBanner();
    this.isRunning = true;

    while (this.isRunning) {
      try {
        for (const account of this.accounts) {
          logger.info(
            `${colors.info}Processing ${account.name}${colors.reset}`
          );

          const isLoggedIn = await this.checkLoginStatus(account);
          if (!isLoggedIn) {
            logger.error(
              `${colors.error}Not logged in, skipping...${colors.reset}`
            );
            continue;
          }

          const initialized = await this.initializeAccount(account);
          if (!initialized) {
            logger.error(
              `${colors.error}Failed to initialize, skipping...${colors.reset}`
            );
            continue;
          }

          const userInfo = await this.getUser(account);
          if (userInfo) {
            await this.processTasks(account);
          }

          if (this.accounts.indexOf(account) < this.accounts.length - 1) {
            logger.info(
              `${colors.info}Waiting for next account...${colors.reset}`
            );
            console.log("");
            await CountdownTimer.countdown(
              CONFIG.DELAYS.BETWEEN_ACCOUNTS / 1000,
              {
                message: `${colors.timerCount}Next account in: ${colors.reset}`,
                colors: {
                  message: colors.timerCount,
                  timer: colors.timerWarn,
                  reset: colors.reset,
                },
              }
            );
            console.log("");
          }
        }

        logger.info(
          `${colors.info}Waiting for next check cycle...${colors.reset}`
        );
        await CountdownTimer.countdown(CONFIG.DELAYS.CHECK_INTERVAL / 1000, {
          message: `${colors.timerCount}Next check in: ${colors.reset}`,
          colors: {
            message: colors.timerCount,
            timer: colors.timerWarn,
            reset: colors.reset,
          },
        });
        console.log("");
        console.clear();
        displayBanner();
      } catch (error) {
        logger.error(
          `${colors.error}Error in main loop: ${error.message}${colors.reset}`
        );
        this.isRunning = false;
      }
    }
  }

  stop() {
    this.isRunning = false;
    process.exit(0);
  }
}

if (!fs.existsSync(CONFIG.COOKIE_FILE)) {
  fs.writeFileSync(CONFIG.COOKIE_FILE, "");
  logger.error(
    `${colors.error}Created data.txt file. Please add one cookie per line.${colors.reset}`
  );
  process.exit(1);
}

const bot = new FarcasterBot();

process.on("SIGINT", async () => {
  bot.stop();
});

bot.start().catch((error) => {
  logger.error(`${colors.error}Fatal error: ${error.message}${colors.reset}`);
});
