import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";

import app from "./app.js";
import { initWhatsApp } from "./services/wa.service.js";
import waRoutes from "./routes/wa.routes.js";

// Atasi serialisasi BigInt
BigInt.prototype.toJSON = function() {
  return Number(this);
};

const PORT = process.env.PORT || 5000;

// Membuka akses folder uploads agar foto bisa diakses via browser secara absolut
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Daftarkan rute WhatsApp ke aplikasi Express
app.use('/whatsapp', waRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  initWhatsApp().catch(err => console.error("Gagal menginisiasi WhatsApp:", err));
});