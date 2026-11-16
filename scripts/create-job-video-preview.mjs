import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const runFile = promisify(execFile);
const ROOT = process.cwd();
const JOBS_PATH = "data/curated-jobs.json";
const BACKGROUND = "assets/job-visual.png";
const LOGO = "assets/zovaro-logo.png";
const AUDIO = "public/audio/solo audio promo zovaro job.mp3";
const OUT_DIR = ".zovaro-job-video";
const OUTPUT = "job-video-preview.mp4";
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const TOTAL_SECONDS = 40;
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}
async function ffmpeg(args) {
  const { stdout, stderr } = await runFile("ffmpeg", args, { maxBuffer: 20 * 1024 * 1024, timeout: 240000 });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stdout.write(stderr);
}
async function probeDuration(file) {
  const { stdout } = await runFile("ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",file]);
  return Number(stdout.trim());
}
function asciiText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[·•]/g, " | ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function wrap(value, max = 29) {
  const words = asciiText(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (next.length > max && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
function clean(value, fallback = "Informazioni nella pagina ufficiale") {
  return asciiText(value || fallback);
}
async function textFile(name, value) {
  const file = path.join(OUT_DIR, name + ".txt");
  await fs.writeFile(file, String(value), "utf8");
  return file;
}
function drawText(file, size, y, bold = false, color = "white") {
  const font = bold ? FONT_BOLD : FONT;
  return `drawtext=fontfile=${font}:textfile=${file}:fontcolor=${color}:fontsize=${size}:line_spacing=12:x=(w-text_w)/2:y=${y}`;
}
async function renderScene(index, duration, lines) {
  const renderLines = [];
  for (const line of lines) {
    const parts = String(line.text).split(/\n/);
    for (let part = 0; part < parts.length; part++) {
      renderLines.push({
        ...line,
        text: parts[part],
        y: line.y + part * (line.size + 12)
      });
    }
  }
  const files = [];
  for (let i = 0; i < renderLines.length; i++) {
    files.push(await textFile(`scene-${index}-${i}`, renderLines[i].text));
  }
  const filters = [
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,drawbox=x=0:y=0:w=1080:h=1920:color=0x06142A@0.43:t=fill[bg]",
    "[1:v]scale=330:-1[logo]",
    "[bg][logo]overlay=(W-w)/2:85,drawbox=x=62:y=420:w=956:h=1320:color=0x06142A@0.68:t=fill:replace=0,drawbox=x=62:y=420:w=956:h=1320:color=0x38BDF8@0.95:t=5[v0]"
  ];
  let current = "v0";
  for (let i = 0; i < renderLines.length; i++) {
    const next = `v${i+1}`;
    filters.push(`[${current}]${drawText(files[i], renderLines[i].size, renderLines[i].y, !!renderLines[i].bold, renderLines[i].color || "white")}` + `[${next}]`);
    current = next;
  }
  filters.push(`[${current}]format=yuv420p[outv]`);
  const output = path.join(OUT_DIR, `scene-${index}.mp4`);
  await ffmpeg([
    "-y","-loop","1","-framerate",String(FPS),"-i",BACKGROUND,
    "-i",LOGO,"-t",String(duration),
    "-filter_complex",filters.join(";"),
    "-map","[outv]","-r",String(FPS),"-an","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",output
  ]);
  return output;
}

for (const file of [JOBS_PATH, BACKGROUND, LOGO, AUDIO]) {
  if (!(await exists(file))) throw new Error(`Required ZOVARO JOB asset missing: ${file}`);
}
if (!(await exists(FONT)) || !(await exists(FONT_BOLD))) throw new Error("DejaVu fonts are unavailable on the runner.");

const jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf8"));
const preferred = [
  "acronis-it-help-desk-technician-2026",
  "canonical-alliances-field-engineer-3433732",
  "kodalab-ai-machine-learning-engineer",
  "puffy-marketing-manager-ai-first"
];
const selected = preferred.map(id => jobs.find(job =>
  job.id === id &&
  job.status === "open" &&
  job.applicationUrl?.startsWith("https://") &&
  job.sourceUrl?.startsWith("https://") &&
  job.verifiedAt
));
if (selected.some(job => !job)) {
  throw new Error("One or more selected job advertisements are no longer marked open or lack an official source/application URL. Refresh curated-jobs.json before generating the video.");
}
const now = new Date();
for (const job of selected) {
  const ageDays = (now - new Date(job.verifiedAt + "T00:00:00Z")) / 86400000;
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 7) {
    throw new Error(`Job verification is stale or invalid for ${job.company}: ${job.verifiedAt}`);
  }
}
const audioDuration = await probeDuration(AUDIO);
if (!Number.isFinite(audioDuration) || audioDuration < 38) {
  throw new Error(`Original JOB music is shorter than expected: ${audioDuration} seconds.`);
}
await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const scenes = [];
scenes.push(await renderScene("intro", 4, [
  { text: "ZOVARO JOBS WORLDWIDE", size: 64, y: 700, bold: true },
  { text: "ANNUNCI DI LAVORO REALI", size: 46, y: 900, bold: true, color: "0x38BDF8" },
  { text: "OPPORTUNITÀ PUBBLICATE DA AZIENDE", size: 30, y: 1040 }
]));
for (let i = 0; i < selected.length; i++) {
  const job = selected[i];
  let location = clean(job.location || job.country, "Località indicata nell'annuncio");
  if (job.company === "Kodalab") location = "Remote | Latin America (eligible countries not specified)";
  if (job.company === "Puffy") location = "Remote | Worldwide via Employer of Record";
  const contract = clean(job.jobType, "Dettagli nella pagina aziendale");
  const salary = job.company === "Puffy"
    ? "Up to USD 143,000/year (base + bonus)"
    : job.salaryText
      ? "Salary: " + clean(job.salaryText)
      : "Salary not published by employer";
  const verified = `FONTE AZIENDALE CONTROLLATA: ${job.verifiedAt}`;
  scenes.push(await renderScene(`job-${i+1}`, 8, [
    { text: `ANNUNCIO ${i+1} / 4`, size: 28, y: 500, bold: true, color: "0x38BDF8" },
    { text: wrap(job.title, 27), size: 56, y: 620, bold: true },
    { text: clean(job.company), size: 40, y: 900, bold: true, color: "0x38BDF8" },
    { text: wrap(location, 34), size: 32, y: 1030 },
    { text: wrap(contract, 34), size: 30, y: 1190 },
    { text: wrap(salary, 43), size: 26, y: 1320 },
    { text: verified, size: 24, y: 1510, bold: true },
    { text: "CANDIDATURA SULLA PAGINA UFFICIALE", size: 25, y: 1605, bold: true, color: "0x38BDF8" }
  ]));
}
scenes.push(await renderScene("outro", 4, [
  { text: "IL TUO PROSSIMO LAVORO", size: 54, y: 720, bold: true },
  { text: "POTREBBE ESSERE QUI", size: 54, y: 830, bold: true, color: "0x38BDF8" },
  { text: "SCOPRI GLI ANNUNCI SU", size: 34, y: 1060 },
  { text: "ZOVARO.VERCEL.APP", size: 48, y: 1170, bold: true },
  { text: "Controlla sempre requisiti e disponibilità sul sito del datore di lavoro.", size: 24, y: 1450 }
]));

const concatFile = path.join(OUT_DIR, "concat.txt");
await fs.writeFile(concatFile, scenes.map(file => `file '${path.basename(file)}'`).join("\n"), "utf8");
const silentVideo = path.join(OUT_DIR, "video-silent.mp4");
await ffmpeg(["-y","-f","concat","-safe","0","-i",concatFile,"-c","copy",silentVideo]);
await ffmpeg([
  "-y","-i",silentVideo,"-stream_loop","-1","-i",AUDIO,
  "-t",String(TOTAL_SECONDS),"-map","0:v:0","-map","1:a:0",
  "-c:v","copy","-c:a","aac","-b:a","192k","-af","afade=t=out:st=38:d=2",
  "-movflags","+faststart",OUTPUT
]);
const finalDuration = await probeDuration(OUTPUT);
if (!Number.isFinite(finalDuration) || finalDuration < 39 || finalDuration > 41) {
  throw new Error(`Final JOB video duration is invalid: ${finalDuration}`);
}
console.log(JSON.stringify({
  output: OUTPUT,
  durationSeconds: Number(finalDuration.toFixed(2)),
  resolution: `${WIDTH}x${HEIGHT}`,
  jobs: selected.map(job => ({ title: job.title, company: job.company, verifiedAt: job.verifiedAt, source: job.sourceName, applicationUrl: job.applicationUrl }))
}, null, 2));
