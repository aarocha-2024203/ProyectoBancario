const escapePdfText = (text) =>
    String(text)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

const PAGE_W    = 612;
const PAGE_H    = 792;
const MARGIN_X  = 48;
const MARGIN_Y  = 52;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const RIGHT_X   = MARGIN_X + CONTENT_W;
const CHAR_W    = 0.52;

const approxWidth = (text, fs) => String(text).length * fs * CHAR_W;
const centerX     = (text, fs) => MARGIN_X + (CONTENT_W - approxWidth(text, fs)) / 2;
const rightX      = (text, fs) => RIGHT_X - approxWidth(text, fs);

const opText = (x, y, font, size, text) =>
    `BT /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${escapePdfText(text)}) Tj ET`;

const opColorText = (x, y, font, size, text, r, g, b) => [
    `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
    opText(x, y, font, size, text),
    `0 0 0 rg`,
];

const opRect = (x, y, w, h, r, g, b) => [
    `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
    `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`,
    `0 0 0 rg`,
];

const opLine = (x1, y1, x2, y2, width = 0.5, r = 0.78, g = 0.78, b = 0.78) => [
    `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`,
    `${width} w`,
    `${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`,
    `0 0 0 RG`,
];


const BLUE_D = [0.094, 0.196, 0.384];
const BLUE_M = [0.157, 0.337, 0.627];
const BLUE_L = [0.918, 0.937, 0.976];
const GOLD   = [0.824, 0.647, 0.173];
const GREY_L = [0.965, 0.965, 0.965];
const WHITE  = [1, 1, 1];

const buildPages = (commands) => {
    const pages = [];
    let ops = [];
    let y   = PAGE_H - MARGIN_Y;

    const flush = () => { pages.push({ ops }); ops = []; y = PAGE_H - MARGIN_Y; };
    const need  = (h) => { if (y - h < MARGIN_Y) flush(); };
    const drop  = (h) => { y -= h; };

    for (const cmd of commands) {
        switch (cmd.type) {

            case 'coverHeader': {
                const blockH = 90;
                need(blockH + 20);

                ops.push(...opRect(0, PAGE_H - MARGIN_Y - blockH, PAGE_W, blockH + MARGIN_Y, ...BLUE_D));
                ops.push(...opRect(0, PAGE_H - MARGIN_Y - blockH - 3, PAGE_W, 3, ...GOLD));

                const titleFs = 22;
                const titleTxt = 'Estado de Cuenta';
                ops.push(...opColorText(centerX(titleTxt, titleFs), PAGE_H - MARGIN_Y - 38, 'F2', titleFs, titleTxt, ...WHITE));
                ops.push(...opColorText(centerX(cmd.bankName, 11), PAGE_H - MARGIN_Y - 62, 'F1', 11, cmd.bankName, ...GOLD));

                y -= blockH + 4;
                drop(10);
                break;
            }

            case 'sectionHeader': {
                const h = 22;
                need(h + 6);
                drop(6);
                ops.push(...opRect(MARGIN_X - 4, y - h + 5, CONTENT_W + 8, h, ...BLUE_L));
                ops.push(...opRect(MARGIN_X - 4, y - h + 5, 3, h, ...BLUE_M));
                ops.push(...opColorText(MARGIN_X + 6, y - 10, 'F2', 8.5, cmd.text.toUpperCase(), ...BLUE_D));
                drop(h + 2);
                break;
            }

            case 'keyvalue': {
                const h = 16;
                need(h);
                if (cmd.zebra) ops.push(...opRect(MARGIN_X - 4, y - h + 4, CONTENT_W + 8, h, ...GREY_L));
                ops.push(opText(MARGIN_X + 4,           y - 2, 'F1', 8.5, cmd.key));
                ops.push(opText(rightX(cmd.value, 8.5), y - 2, 'F1', 8.5, cmd.value));
                drop(h);
                break;
            }

            case 'txRow': {
                const h = 16;
                need(h);
                if (cmd.index % 2 === 0) ops.push(...opRect(MARGIN_X - 4, y - h + 4, CONTENT_W + 8, h, ...GREY_L));
                ops.push(...opColorText(MARGIN_X + 4, y - 2, 'F1', 7.5, cmd.date, 0.45, 0.45, 0.45));
                ops.push(opText(MARGIN_X + 56, y - 2, 'F1', 8.5, cmd.label));
                const [ar, ag, ab] = cmd.isDebit ? [0.75, 0.1, 0.1] : [0.1, 0.5, 0.22];
                ops.push(...opColorText(rightX(cmd.amount, 8.5), y - 2, 'F1', 8.5, cmd.amount, ar, ag, ab));
                drop(h);
                break;
            }

            case 'totalRow': {
                const h = 20;
                need(h + 4);
                drop(4);
                ops.push(...opLine(MARGIN_X, y + 2, RIGHT_X, y + 2, 0.75, ...BLUE_M));
                ops.push(...opRect(MARGIN_X - 4, y - h + 6, CONTENT_W + 8, h, ...BLUE_L));
                ops.push(...opColorText(MARGIN_X + 4,         y - 3, 'F2', 9, cmd.key,   ...BLUE_D));
                ops.push(...opColorText(rightX(cmd.value, 9), y - 3, 'F2', 9, cmd.value, ...BLUE_D));
                drop(h + 2);
                break;
            }

            case 'divider': {
                need(10);
                ops.push(...opLine(MARGIN_X, y - 4, RIGHT_X, y - 4));
                drop(10);
                break;
            }

            case 'text': {
                need(14);
                ops.push(...opColorText(MARGIN_X + 4, y - 2, 'F1', 7.5, cmd.text, 0.35, 0.35, 0.35));
                drop(14);
                break;
            }

            case 'footer': {
                need(20);
                drop(6);
                ops.push(...opRect(MARGIN_X - 4, y - 12, CONTENT_W + 8, 16, ...BLUE_D));
                ops.push(...opColorText(centerX(cmd.text, 7.5), y - 3, 'F1', 7.5, cmd.text, ...GOLD));
                drop(16);
                break;
            }

            case 'spacer':
                drop(cmd.h ?? 10);
                break;
        }
    }

    if (ops.length) flush();
    return pages;
};

export const generatePdfFromCommands = (commands) => {
    const pages = buildPages(commands);
    const N     = pages.length;

    const pageBase    = 3;
    const contentBase = pageBase + N;
    const fontF1Id    = contentBase + N;
    const fontF2Id    = fontF1Id + 1;
    const totalObjs   = fontF2Id;

    const pageIds = Array.from({ length: N }, (_, i) => pageBase + i);
    const kidsRef = pageIds.map((id) => `${id} 0 R`).join(' ');
    const fontRes = `/Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R >>`;

    const objStrings = [
        `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
        `2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${N} >>\nendobj\n`,
    ];

    for (let i = 0; i < N; i++) {
        const pid = pageBase + i;
        const cid = contentBase + i;
        objStrings.push(
            `${pid} 0 obj\n` +
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]\n` +
            `   /Resources << ${fontRes} >> /Contents ${cid} 0 R >>\nendobj\n`
        );
    }

    for (let i = 0; i < N; i++) {
        const cid  = contentBase + i;
        const body = pages[i].ops.flat().join('\n');
        objStrings.push(
            `${cid} 0 obj\n<< /Length ${Buffer.byteLength(body, 'utf8')} >>\nstream\n${body}\nendstream\nendobj\n`
        );
    }

    objStrings.push(
        `${fontF1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`,
        `${fontF2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`,
    );

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (const obj of objStrings) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${totalObjs + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (const offset of offsets) {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
};

export const generateSimplePdfBuffer = (lines) =>
    generatePdfFromCommands(lines.map((l) => ({ type: 'text', text: l })));

export const buildStatementSummary = ({ account, transactions, periodStart, periodEnd }) => {
    const totals = {
        totalDeposits: 0, totalWithdrawals: 0,
        totalTransfersSent: 0, totalTransfersReceived: 0,
        interestEarned: 0, feesCharged: 0,
    };
    let netChange = 0;

    for (const tx of transactions) {
        const amount        = Number(tx.amount) || 0;
        const isSource      = tx.sourceAccountNumber      === account.accountNumber;
        const isDestination = tx.destinationAccountNumber === account.accountNumber;

        if (tx.transactionType === 'deposito'     && isDestination) { totals.totalDeposits         += amount; netChange += amount; }
        if (tx.transactionType === 'retiro'        && isSource)      { totals.totalWithdrawals       += amount; netChange -= amount; }
        if (tx.transactionType === 'transferencia' && isSource)      { totals.totalTransfersSent     += amount; netChange -= amount; }
        if (tx.transactionType === 'transferencia' && isDestination) { totals.totalTransfersReceived += amount; netChange += amount; }
        if (['pago_servicio', 'pago_prestamo'].includes(tx.transactionType) && isSource) {
            totals.feesCharged += amount; netChange -= amount;
        }
    }

    const closingBalance = Number(account.balance) || 0;
    return { periodStart, periodEnd, openingBalance: closingBalance - netChange, closingBalance, ...totals };
};

export const generateStatementPdf = ({ account, summary, transactions, currencySymbols = {} }) => {
    const resolveSymbol = (currencyCode) =>
        currencySymbols[currencyCode] || account.currencySymbol || account.currency || 'GTQ';

    const fmt = (n, currencyCode) =>
        `${resolveSymbol(currencyCode)}${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtDate = (d)  => d ? new Date(d).toLocaleDateString('es-GT') : '—';
    const txLabel = (tx) => ({
        deposito:      'Deposito',
        retiro:        'Retiro',
        transferencia: 'Transferencia',
        pago_servicio: 'Pago de Servicio',
        pago_prestamo: 'Pago de Prestamo',
    }[tx.transactionType] ?? tx.transactionType);

    const isDebit = (tx) =>
        ['retiro', 'transferencia', 'pago_servicio', 'pago_prestamo'].includes(tx.transactionType)
        && tx.sourceAccountNumber === account.accountNumber;

    const commands = [
        { type: 'coverHeader', bankName: account.bankName ?? 'Kinal Banks'},
        { type: 'spacer', h: 14 },

        { type: 'sectionHeader', text: 'Informacion de la cuenta' },
        { type: 'keyvalue', key: 'ID',      value: account.ownerId    ?? '—', zebra: true  },
        { type: 'keyvalue', key: 'Titular', value: account.ownerName  ?? '—', zebra: false },
        { type: 'keyvalue', key: 'No. de cuenta',  value: account.accountNumber ?? '—', zebra: true  },
        { type: 'keyvalue', key: 'Tipo de cuenta', value: account.accountType   ?? '—', zebra: false },
        { type: 'keyvalue', key: 'Moneda',         value: account.currency      ?? 'GTQ', zebra: true },
        { type: 'spacer', h: 10 },

        { type: 'sectionHeader', text: 'Periodo del estado' },
        { type: 'keyvalue', key: 'Fecha de inicio', value: fmtDate(summary.periodStart), zebra: false },
        { type: 'keyvalue', key: 'Fecha de corte',  value: fmtDate(summary.periodEnd),   zebra: true  },
        { type: 'spacer', h: 10 },

        { type: 'sectionHeader', text: 'Resumen de movimientos' },
        { type: 'keyvalue', key: 'Saldo inicial',                value: fmt(summary.openingBalance, account.currency),         zebra: false },
        { type: 'keyvalue', key: 'Total depositos',              value: fmt(summary.totalDeposits, account.currency),          zebra: true  },
        { type: 'keyvalue', key: 'Total de dinero retirado',                value: fmt(summary.totalWithdrawals, account.currency),       zebra: false },
        { type: 'keyvalue', key: 'Total de transferencias enviadas',      value: fmt(summary.totalTransfersSent, account.currency),     zebra: true  },
        { type: 'keyvalue', key: 'Total de transferencias recibidas',     value: fmt(summary.totalTransfersReceived, account.currency), zebra: false },
        //{ type: 'keyvalue', key: 'Pagos de servicios/prestamos', value: fmt(summary.feesCharged),            zebra: true  },
        { type: 'totalRow', key: 'SALDO FINAL', value: fmt(summary.closingBalance, account.currency) },
        { type: 'spacer', h: 14 },

        { type: 'sectionHeader', text: 'Detalle de transacciones' },
        { type: 'spacer', h: 2 },
    ];

    transactions.forEach((tx, i) => {
        commands.push({
            type:    'txRow',
            date:    fmtDate(tx.date),
            label:   txLabel(tx) + (tx.description ? `  -  ${tx.description}` : ''),
            amount:  fmt(tx.amount, tx.currencyCode || account.currency),
            isDebit: isDebit(tx),
            index:   i,
        });
    });

    commands.push(
        { type: 'spacer', h: 20 },
        { type: 'footer', text: 'Documento generado electronicamente. No requiere firma ni sello.' },
    );

    return generatePdfFromCommands(commands);
};
