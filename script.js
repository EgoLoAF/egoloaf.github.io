"use strict";

const tasks = [
  {title:"Tissue-to-Box",image:"task-1-tissue-box.webp",description:"Grasp a tissue pack, turn the torso, and place the pack precisely into a box.",teleop:81.4,without:64.2,ours:81.0},
  {title:"Tissue-to-Bin",image:"task-2-low-bin.webp",description:"Pick up a tissue pack, turn, and bend or squat to place the pack into a low bin.",teleop:75.2,without:55.8,ours:70.0},
  {title:"Pick-Turn-Place",image:"task-3-plush-tray.webp",description:"Pick up both plush toys, turn, and place the toys into a tray with coordinated two-hand motion.",teleop:74.8,without:50.2,ours:75.4},
  {title:"Tissue-to-Cabinet",image:"task-4-cabinet.webp",description:"Carry a tissue pack to the cabinet, lower the body to place it inside, and close both doors.",teleop:66.0,without:42.5,ours:65.8}
];

const taskButtons = Array.from(document.querySelectorAll("[data-task]"));
function selectTask(index, focus = false) {
  const task = tasks[index];
  taskButtons.forEach((button, i) => {
    button.setAttribute("aria-selected", String(i === index));
    button.tabIndex = i === index ? 0 : -1;
  });
  document.getElementById("task-panel").setAttribute("aria-labelledby", taskButtons[index].id);
  const image = document.getElementById("task-image");
  image.src = `./assets/${task.image}`;
  image.alt = `${task.title}: ${task.description}`;
  document.getElementById("task-kicker").textContent = `Task ${String(index + 1).padStart(2, "0")}`;
  document.getElementById("task-title").textContent = task.title;
  document.getElementById("task-description").textContent = task.description;
  ["teleop", "without", "ours"].forEach(key => {
    document.getElementById(`score-${key}`).textContent = task[key].toFixed(1);
    document.getElementById(`bar-${key}`).style.setProperty("--score", `${task[key]}%`);
  });
  document.getElementById("chart-summary").textContent = `${task.title}: EgoLoAF ${task.ours.toFixed(1)}, teleoperation-trained baseline ${task.teleop.toFixed(1)}, ego without affordances ${task.without.toFixed(1)}.`;
  if (focus) taskButtons[index].focus();
}
taskButtons.forEach((button, index) => {
  button.addEventListener("click", () => selectTask(index));
  button.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tasks.length;
    if (event.key === "ArrowLeft") next = (index + tasks.length - 1) % tasks.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tasks.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTask(next, true); }
  });
});

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.getElementById("navigation");
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("open", expanded);
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("open");
}));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    menuButton.focus();
  }
});

const dialog = document.getElementById("figure-dialog");
document.querySelectorAll("[data-zoom]").forEach(button => button.addEventListener("click", () => {
  document.getElementById("dialog-image").src = button.dataset.zoom;
  document.getElementById("dialog-image").alt = button.querySelector("img").alt;
  document.getElementById("dialog-title").textContent = button.dataset.title;
  dialog.showModal();
  document.body.classList.add("no-scroll");
}));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => document.body.classList.remove("no-scroll"));
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

const copyButton = document.getElementById("copy-citation");
copyButton.addEventListener("click", async () => {
  const citation = document.getElementById("bibtex").textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(citation);
    } else {
      const field = document.createElement("textarea");
      field.value = citation; field.setAttribute("readonly", "");
      field.style.position = "fixed"; field.style.opacity = "0";
      document.body.appendChild(field); field.select();
      const copied = document.execCommand("copy"); field.remove();
      if (!copied) throw new Error("Clipboard unavailable");
    }
    copyButton.textContent = "Copied!";
    document.getElementById("copy-status").textContent = "Citation copied to clipboard.";
    setTimeout(() => { copyButton.textContent = "Copy citation"; }, 2200);
  } catch (_) {
    copyButton.textContent = "Select text to copy";
    document.getElementById("copy-status").textContent = "Please select the citation text and copy it.";
    const range = document.createRange(); range.selectNodeContents(document.getElementById("bibtex"));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  }
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll("a").forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: "-15% 0px -65% 0px" });
  document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
}

// Keep original recording timestamps; speed changes only affect playback.
const demoPlayers = [];
const allowDemoAutoplay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  && !navigator.connection?.saveData;

document.querySelectorAll(".demo-card").forEach(card => {
  const video = card.querySelector("video");
  const speedControl = card.querySelector("select");
  const defaultRate = Number(video.dataset.playbackRate);
  let visible = false;
  let resumeWhenVisible = allowDemoAutoplay;
  let automaticPause = false;

  video.defaultPlaybackRate = defaultRate;
  video.playbackRate = defaultRate;
  card.querySelector(".demo-speed").hidden = false;
  speedControl.addEventListener("change", () => {
    video.playbackRate = Number(speedControl.value);
  });
  video.addEventListener("ratechange", () => {
    const rate = String(video.playbackRate);
    if (![...speedControl.options].some(option => option.value === rate)) {
      speedControl.add(new Option(`${rate}×`, rate));
    }
    speedControl.value = rate;
  });

  function pauseAutomatically() {
    if (!video.paused) {
      automaticPause = true;
      video.pause();
    }
  }
  function updatePlayback() {
    if (!visible || document.hidden) {
      pauseAutomatically();
    } else if (resumeWhenVisible && video.paused) {
      // Native controls remain available if the browser blocks autoplay.
      video.play().catch(() => {});
    }
  }
  video.addEventListener("pause", () => {
    if (!automaticPause) resumeWhenVisible = false;
    automaticPause = false;
  });
  video.addEventListener("play", () => { resumeWhenVisible = true; });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
      updatePlayback();
    }, { threshold: [0, 0.25] });
    observer.observe(video);
  }
  demoPlayers.push(updatePlayback);
});
document.addEventListener("visibilitychange", () => demoPlayers.forEach(update => update()));
