/**
 *
 * @param {number} value
 * @param {number} divisor
 * @returns {[number, number]}
 */
function divMod(value, divisor) {
  return [Math.floor(value / divisor), Math.floor(value % divisor)];
}

/**
 *
 * @param {number} start
 * @param {number} stop
 * @returns
 */
function range(start, stop) {
  const res = [];

  for (let i = start; i <= stop; ++i) {
    res.push(i);
  }

  return res;
}

/**
 *
 * @param {number} value
 * @returns {[number, number]}
 */
function splitTensAndOnes(value) {
  return divMod(value, 10);
}

/**
 * @typedef {{
 *  label: string;
 *  timeZoneId: string;
 *  size: `${number}px`;
 * }} TimeZoneConfig
 */

/**
 *
 * @param {string} timeZoneId
 * @returns
 */
function getTimeZoneOffset(timeZoneId) {
  const date = new Date();

  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(
    date.toLocaleString("en-US", { timeZone: timeZoneId })
  );

  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

/**
 *
 * @param {string} timeZoneId
 * @returns
 */
function getTimeZoneOffsetString(timeZoneId) {
  const timeZoneOffsetMinutes = getTimeZoneOffset(timeZoneId);

  const sign = timeZoneOffsetMinutes < 0 ? "-" : "+";
  const absoluteOffset = Math.abs(timeZoneOffsetMinutes);

  const [hours, minutes] = divMod(absoluteOffset, 60);
  const [hoursString, minutesString] = [`${hours}`, `${minutes}`];

  return `UTC${sign}${hoursString.padStart(2, "0")}:${minutesString.padStart(
    2,
    "0"
  )}`;
}

/**
 * @type {TimeZoneConfig[]}
 */
const configs = [
  {
    timeZoneId: "America/Chicago",
    label: "Chicago",
    size: "40px",
  },
  {
    timeZoneId: "Asia/Kolkata",
    label: "India",
    size: "40px",
  },
  {
    timeZoneId: "Europe/London",
    label: "London",
    size: "40px",
  },
  {
    timeZoneId: "Asia/Dubai",
    label: "Dubai",
    size: "40px",
  },
];

configs.forEach((config) => {
  config.label = `${config.label} (${getTimeZoneOffsetString(
    config.timeZoneId
  )})`;
});

class ClockBase {
  rootClassName = "";

  /**
   *
   * @param {string} rootClassName
   * @param {TimeZoneConfig} config
   */
  constructor(rootClassName, config) {
    this.rootClassName = rootClassName;
    this.timeZoneId = config.timeZoneId;

    this.container = document.createElement("div");

    this.container.classList.add("background-container");

    {
      const background = document.createElement("div");

      background.classList.add("background");

      background.style.setProperty(
        "--background",
        `url(./images/${config.timeZoneId.toLowerCase().replace("/", "-")}.jpg)`
      );

      this.container.appendChild(background);
    }

    {
      const x = document.createElement("div");

      x.classList.add("clock-with-label");

      {
        const label = document.createElement("div");

        label.classList.add("label");

        label.innerText = config.label;

        x.appendChild(label);
      }

      {
        const wrapper = document.createElement("div");

        wrapper.classList.add("clock-wrapper");

        {
          const clockContainer = document.createElement("div");

          clockContainer.classList.add(this.rootClassName);
          clockContainer.style.setProperty("--cell-size", config.size);

          wrapper.appendChild(clockContainer);
        }

        x.appendChild(wrapper);
      }

      this.container.appendChild(x);
    }
  }

  getRootElement() {
    return this.container.getElementsByClassName(this.rootClassName)[0];
  }

  getCurrentTimeParts() {
    const currentTime = new Date();

    currentTime.setMinutes(
      currentTime.getMinutes() + getTimeZoneOffset(this.timeZoneId)
    );

    const [[h_t, h_o], [m_t, m_o], [s_t, s_o]] = [
      splitTensAndOnes(currentTime.getUTCHours()),
      splitTensAndOnes(currentTime.getUTCMinutes()),
      splitTensAndOnes(currentTime.getUTCSeconds()),
    ];

    return [h_t, h_o, m_t, m_o, s_t, s_o];
  }

  updateDisplay() {}
}

class ScrollingClock extends ClockBase {
  limits = [
    range(0, 2),
    range(0, 9),
    range(0, 5),
    range(0, 9),
    range(0, 5),
    range(0, 9),
  ];

  /**
   *
   * @param {TimeZoneConfig} config
   */
  constructor(config) {
    super("scrolling-clock-container", config);

    {
      const clockContainer = this.getRootElement();

      for (const rng of this.limits) {
        const rngContainer = document.createElement("div");

        rngContainer.classList.add("rng-container", "offset-value");

        for (const i of rng) {
          const numContainer = document.createElement("div");

          numContainer.classList.add("number-container");

          const overlayDiv = document.createElement("div");

          overlayDiv.classList.add("inner");
          overlayDiv.textContent += String(i);

          numContainer.appendChild(overlayDiv);
          rngContainer.appendChild(numContainer);
        }

        clockContainer.appendChild(rngContainer);
      }
    }
  }

  updateDisplay() {
    const currentTimeParts = this.getCurrentTimeParts();

    const clockContainer = this.getRootElement();

    if (!(clockContainer instanceof HTMLDivElement)) {
      throw new Error("Unexpected element type");
    }

    for (const i of range(0, 5)) {
      const currentDigit = currentTimeParts[i];
      const currentContainer = clockContainer.children[i];

      if (!(currentContainer instanceof HTMLDivElement)) {
        throw new Error("Unexpected element type");
      }

      for (const i of range(0, 9)) {
        currentContainer.children[i]?.classList.remove("active");
      }

      currentContainer.style.setProperty("--offset", `${currentDigit}`);
      currentContainer.children[currentDigit].classList.add("active");
    }

    return this;
  }
}

class AnalogPixel {
  constructor() {
    this.container = document.createElement("div");

    this.container.classList.add("pixel-container");

    const square = document.createElement("div");

    square.classList.add("square");

    [0, 0]
      .map((value) => {
        return /** @type {const} */ ([document.createElement("div"), value]);
      })
      .forEach(([needle, value], index) => {
        needle.classList.add("needle");
        needle.classList.add(`n${index}`);

        needle.style.setProperty("--number", `${value}`);

        square.appendChild(needle);
      });

    this.container.appendChild(square);
  }

  /**
   *
   * @param {number} n1
   * @param {number} n2
   */
  set(n1, n2) {
    const needles = this.container.getElementsByClassName("needle");

    [n1, n2].forEach((value, index) => {
      const needle = needles[index];

      if (!(needle instanceof HTMLDivElement)) {
        throw new Error("Invalid element type");
      }

      needle.style.setProperty("--number", `${value}`);
    });
  }
}

class AnalogPixelDigit {
  /**
   * @type {Record<'_' | number, [number, number][]>}
   */
  digitMap = {
    _: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    0: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [6, 9],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 3],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    1: [
      [3, 6],
      [3, 9],
      [6, 9],
      [7.5, 7.5],
      [0, 3],
      [6, 9],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [3, 6],
      [0, 9],
      [0, 3],
      [6, 9],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    2: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    3: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    4: [
      [3, 6],
      [6, 9],
      [3, 6],
      [6, 9],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 6],
      [0, 3],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 3],
      [0, 9],
    ],
    5: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    6: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [6, 9],
      [0, 6],
      [0, 6],
      [0, 3],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    7: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 6],
      [0, 6],
      [7.5, 7.5],
      [7.5, 7.5],
      [0, 3],
      [0, 9],
    ],
    8: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [6, 9],
      [0, 6],
      [0, 5],
      [0, 3],
      [0, 9],
      [0, 7],
      [1, 6],
      [3, 6],
      [6, 9],
      [6, 11],
      [0, 6],
      [0, 3],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
    9: [
      [3, 6],
      [3, 9],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [6, 9],
      [0, 6],
      [0, 6],
      [0, 3],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [6, 9],
      [0, 6],
      [3, 6],
      [3, 9],
      [0, 9],
      [0, 6],
      [0, 3],
      [3, 9],
      [3, 9],
      [0, 9],
    ],
  };

  constructor() {
    this.container = document.createElement("div");

    this.container.classList.add("pixel-grid");

    this.pixelInstances = this.digitMap._.map(() => {
      return new AnalogPixel();
    });

    this.pixelInstances.forEach((instance) => {
      this.container.appendChild(instance.container);
    });
  }

  /**
   *
   * @param {number} digit
   */
  set(digit) {
    this.digitMap._.forEach((_, index) => {
      this.pixelInstances[index].set(...this.digitMap[digit][index]);
    });
  }
}

class AnalogPixelsClock extends ClockBase {
  /**
   *
   * @param {TimeZoneConfig} config
   */
  constructor(config) {
    super("analog-pixels-clock-container", config);

    {
      const clockContainer = this.getRootElement();

      this.digitInstances = range(0, 5).map(() => {
        return new AnalogPixelDigit();
      });

      this.digitInstances.forEach((instance) => {
        clockContainer.appendChild(instance.container);
      });
    }
  }

  updateDisplay() {
    const currentTimeParts = this.getCurrentTimeParts();

    for (const i of range(0, 5)) {
      this.digitInstances[i].set(currentTimeParts[i]);
    }

    return this;
  }
}

class BlockyDigit {
  /**
   * @type {Record<'_' | number, [number, number, number][]>}
   */
  digitMap = {
    _: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    0: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    1: [
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
    ],
    2: [
      [0, 0, 0],
      [2, 1, 0],
      [0, 0, 0],
      [0, -1, -2],
      [0, 0, 0],
    ],
    3: [
      [0, 0, 0],
      [2, 1, 0],
      [0, 0, 0],
      [2, 1, 0],
      [0, 0, 0],
    ],
    4: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
      [2, 1, 0],
      [2, 1, 0],
    ],
    5: [
      [0, 0, 0],
      [0, -1, -2],
      [0, 0, 0],
      [2, 1, 0],
      [0, 0, 0],
    ],
    6: [
      [0, 0, 0],
      [0, -1, -2],
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    7: [
      [0, 0, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
      [2, 1, 0],
    ],
    8: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    9: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
      [2, 1, 0],
      [0, 0, 0],
    ],
  };

  constructor() {
    this.container = document.createElement("div");

    this.container.classList.add("pixel-grid");

    this.pixels = this.digitMap._.flat().map(() => {
      const wrapper = document.createElement("div");

      wrapper.classList.add("pixel-wrapper");

      const pixel = document.createElement("div");

      pixel.classList.add("pixel");
      pixel.classList.add("square");

      wrapper.appendChild(pixel);

      return wrapper;
    });

    this.pixels.forEach((pixel) => {
      this.container.appendChild(pixel);
    });
  }

  /**
   *
   * @param {number} digit
   */
  set(digit) {
    this.digitMap[digit].flat().map((value, index) => {
      this.pixels[index].style.setProperty("--position", `${value}`);
    });
  }
}

class BlockyClock extends ClockBase {
  /**
   *
   * @param {TimeZoneConfig} config
   */
  constructor(config) {
    super("blocky-clock-container", config);

    {
      const clockContainer = this.getRootElement();

      this.digitInstances = range(0, 5).map(() => {
        return new BlockyDigit();
      });

      this.digitInstances.forEach((instance) => {
        clockContainer.appendChild(instance.container);
      });
    }
  }

  updateDisplay() {
    const currentTimeParts = this.getCurrentTimeParts();

    for (const i of range(0, 5)) {
      this.digitInstances[i].set(currentTimeParts[i]);
    }

    return this;
  }
}

/**
 * @type {number | null}
 */
let updaterInterval = null;
let index = -1;
const clockClasses = [ScrollingClock, AnalogPixelsClock, BlockyClock];

/**
 * @param {new (config: TimeZoneConfig) => ClockBase} ClockClass
 */
function showClock(ClockClass) {
  const grid = document.getElementById("clock-grid");
  const instances = configs.map((config) => new ClockClass(config));

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  instances.forEach((instance) => {
    grid.appendChild(instance.container);
  });

  function updater() {
    instances.forEach((x) => x.updateDisplay());
  }

  updaterInterval && clearInterval(updaterInterval);
  updater();
  updaterInterval = setInterval(updater, 1 * 1000);
}

function clockMain() {
  index = (index + 1) % clockClasses.length;
  showClock(clockClasses[index]);
}

document.addEventListener('click', (e) => clockMain());

// Trigger initial display
clockMain();
