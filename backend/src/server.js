import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";

import app from "./app.js";
import { initWhatsApp } from "./services/wa.service.js";

// Atasi serialisasi BigInt
BigInt.prototype.toJSON = function() {
  return Number(this);
};

const PORT = process.env.PORT || 5000;

// Membuka akses folder uploads agar foto bisa diakses via browser
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  initWhatsApp().catch(err => console.error("Gagal menginisiasi WhatsApp:", err));
});