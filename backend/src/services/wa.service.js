import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

let sock = null;

export async function initWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('wa_credentials');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        markOnlineOnConnect: false,
        browser: ['IT Support Management', 'Chrome', '10.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n--- SCAN QR CODE INI UNTUK LOGIN WHATSAPP ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            sock = null;
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Koneksi WA terputus. Menghubungkan ulang...');
            if (shouldReconnect) {
                setTimeout(() => initWhatsApp(), 3000);
            } else {
                console.log('❌ WhatsApp Logged Out. Hapus folder wa_credentials untuk scan ulang.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot WhatsApp Berhasil Terhubung dan Siap Digunakan!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

export const sendWAMessage = async (number, text) => {
    if (!sock) {
        throw new Error('Koneksi WhatsApp sedang terputus atau belum siap. Mohon tunggu beberapa detik.');
    }

    if (!number) {
        throw new Error('Nomor tujuan pengiriman WhatsApp tidak boleh kosong.');
    }
    
    let cleanNumber = number.toString().trim();
    let targetJid = cleanNumber;

    if (!targetJid.includes('@g.us') && !targetJid.includes('@s.whatsapp.net')) {
        let formatted = cleanNumber.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        if (!formatted) {
            throw new Error('Format nomor tujuan WhatsApp tidak valid.');
        }
        targetJid = `${formatted}@s.whatsapp.net`;
    }
    
    try {
        const response = await sock.sendMessage(targetJid, { text }, {
            timeout: 15000 
        });
        return response;
    } catch (error) {
        console.error('Gagal mengirim pesan WhatsApp:', error);
        throw new Error('Gagal mengirim pesan WA: ' + (error.message || 'Connection Closed'));
    }
};