/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Alchemize API server for Siddha Sound Oracle.
 * Run separately: npx tsx server/alchemize-server.ts
 * Requires: express, multer, fluent-ffmpeg, ffmpeg-static, @supabase/supabase-js
 * Set env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * For dev: run this on port 3000 and add proxy in vite.config:
 *   server: { proxy: { '/api': 'http://localhost:3000' } }
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const app = express();
const PORT = 3000;
const upload = multer({ dest: "uploads/" });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

app.use(express.json());

app.post("/api/alchemize", upload.single("audio"), async (req: express.Request, res: express.Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const { healingFrequencyHz, binauralBase, binauralTarget, masterEnergyEq } = req.body;

  let scalarWaveKeys: string[] = [];
  try {
    scalarWaveKeys = req.body.scalarWaveKeys ? JSON.parse(req.body.scalarWaveKeys) : [];
  } catch {
    scalarWaveKeys = [];
  }

  if (!file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const inputPath = file.path;
  const outputPath = path.join("uploads", `alchemized_${Date.now()}.mp3`);

  try {
    console.log("Starting 2050 Quantum Synthesis...");
    if (scalarWaveKeys.length > 0) {
      console.log(`Scalar Wave Transmissions active: ${scalarWaveKeys.length} fields`);
    }

    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.error("ffprobe error:", err);
        return res.status(500).json({ error: "Could not analyze audio duration" });
      }

      const duration = metadata.format.duration || 300;
      const hz = parseFloat(healingFrequencyHz) || 111;
      const bBase = parseFloat(binauralBase) || 174;
      const bTarget = parseFloat(binauralTarget) || 2.5;
      const bRight = bBase + bTarget;

      console.log(`Synthesizing: ${hz}Hz Sine, ${bBase}Hz/${bRight}Hz Binaural for ${duration}s`);

      let command = ffmpeg(inputPath)
        .input(`sine=f=${hz}:d=${duration}`)
        .inputFormat("lavfi")
        .input(`sine=f=${bBase}:d=${duration}`)
        .inputFormat("lavfi")
        .input(`sine=f=${bRight}:d=${duration}`)
        .inputFormat("lavfi");

      const filterComplex = [
        "[1:a]volume=0.05[healing]",
        "[2:a]pan=stereo|c0=c0|c1=0,volume=0.03[left]",
        "[3:a]pan=stereo|c0=0|c1=c0,volume=0.03[right]",
        "[left][right]amix=inputs=2[binaural]",
        "[0:a][healing][binaural]amix=inputs=3[mixed]"
      ];

      const finalFilter = masterEnergyEq ? `[mixed]${masterEnergyEq}` : "[mixed]";

      command
        .complexFilter([...filterComplex, `${finalFilter}[out]`])
        .map("[out]");

      command.outputOptions(["-id3v2_version", "3"]);
      command.outputOption("-metadata", "SQI_TRANSMISSION=Siddha Sound Alchemy Oracle 2050|Kaya Kalpa Quantum Synthesis");
      command.outputOption("-metadata", `ALCHEMY_PARAMS=${hz}Hz-Sine|${bBase}Hz-${bRight}Hz-Binaural|${masterEnergyEq || "none"}`);

      scalarWaveKeys.forEach((metadataKey: string, index: number) => {
        command.outputOption("-metadata", `SCALAR_FIELD_${index + 1}=${metadataKey}`);
        console.log(`  ↳ Imprinting: SCALAR_FIELD_${index + 1}`);
      });

      command
        .on("end", async () => {
          console.log("Alchemy complete.");

          let publicUrl: string | null = null;
          if (supabase) {
            const fileBuffer = fs.readFileSync(outputPath);
            const { data, error } = await supabase.storage
              .from("meditations")
              .upload(`alchemy_${Date.now()}.mp3`, fileBuffer, { contentType: "audio/mpeg" });

            if (!error && data?.path) {
              publicUrl = `${supabaseUrl}/storage/v1/object/public/meditations/${data.path}`;
            }
          }

          fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

          const scalarSummary = scalarWaveKeys.length > 0
            ? ` | ${scalarWaveKeys.length} Scalar Field${scalarWaveKeys.length > 1 ? "s" : ""} Imprinted.`
            : "";

          res.json({
            status: "Success",
            message: `Kaya Kalpa Quantum Synthesis Complete.${scalarSummary}`,
            url: publicUrl
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          res.status(500).json({ error: "Alchemy failed during processing" });
        })
        .save(outputPath);
    });
  } catch (error) {
    console.error("Alchemy error:", error);
    res.status(500).json({ error: "Internal server error during alchemy" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Alchemize API running on http://localhost:${PORT}`);
});
