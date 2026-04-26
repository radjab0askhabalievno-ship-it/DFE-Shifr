// ============================================================
// DFE! ENGINE v3.0 - Complete Logic Module
// All dictionaries, encoding, decoding, state, and functions
// ============================================================

// ==================== DICTIONARIES ====================
const ruToDfe = {
    'А':'$r','Б':'&f^','В':'<&g','Г':'$4F','Д':'@rD','Е':'*$r','Ё':'*$r%',
    'Ж':'&^:%r','З':'^%$#r','И':'$№f','Й':'&$^r','К':'^:%r','Л':'&/h',
    'М':'#@Tr','Н':'^%H','О':'%J*','П':'&^YrE','Р':'**&r','С':'$#C',
    'Т':'*(P^','У':'^%f','Ф':'^:;&r','Х':'^&^:rG','Ц':'#@%rG','Ч':'$:;rt',
    'Ш':'*I&^','Щ':'*&%^:T','Ъ':'&$;r','Ы':'-*^r','Ь':'%:*r','Э':'^%&$rG',
    'Ю':'**$&^)rY','Я':'$&^)rY'
};

const enToDfe = {
    'A':'**$r','B':'**&f^','C':'**<&g','D':'**$4F','E':'**@rD','F':'***$r',
    'G':'**&^:%r','H':'**^%$#r','I':'**$№f','J':'**&$^r','K':'**^:%r',
    'L':'**&/h','M':'**#@Tr','N':'**^%H','O':'**%J*','P':'**&^YrE',
    'Q':'****&r','R':'**$#C','S':'***(P^','T':'**^%f','U':'**^:;&r',
    'V':'**^&^:rG','W':'**#@%rG','X':'**$:;rt','Y':'***I&^','Z':'***&%^:T'
};

let digitsToDfe = {};
for (let i = 0; i <= 9; i++) digitsToDfe[String(i)] = '-)' + i;

let symbolsToDfe = {
    ',':'.-','!':'=+-','?':'-.,-=','.':')_-.',':':'..--..',';':'--..--.',
    '…':'...-.-','№':'N-o-','"':'_)-:r','«':'_)-:r','»':'_)-:r',"'":'(/&$r',
    '+':'--._-','-':'-..-','=':').=.-','*':'*','/':'/','%':'%',
    '(':'(',')':')','[':'[',']':']','{':'{','}':'}',
    '@':'<^%','#':'#','$':'$','&':'&','_':'%$*@t','|':'|','~':'~',
    '\\':'\\','\n':'\\n','\t':'\\t',' ':' ',
    '—':'--..--','–':'--..-',
    '😀':':)D','😂':':\'D','😍':':**','😢':':\'(' ,'😡':'>:(' ,'👍':':+)',
    '👎':':-(' ,'🔥':':fire:','💯':':100:','✅':':ok:','❌':':no:','⭐':':star:',
    '💡':':idea:','🎉':':party:','💀':':skull:','👻':':ghost:','🤖':':robot:',
    '💾':':save:','📋':':clip:','🗑':':trash:','🔄':':swap:','🎲':':dice:',
    '🔊':':speak:','💰':':money:','💎':':gem:','👤':':user:','🏆':':trophy:',
    '⛏':':pick:','💝':':heart:','💥':':boom:','⚡':':zap:','🦊':':fox:',
    '🐼':':panda:','🐱':':cat:','🐶':':dog:','🦄':':unicorn:','🐉':':dragon:',
    '🌓':':moon:','☀️':':sun:','🌐':':web:','📥':':in:','📤':':out:',
};

let allToDfe = {};
let dfeToChar = {};
let sortedCodes = [];

function rebuildDicts() {
    allToDfe = {...ruToDfe, ...enToDfe, ...digitsToDfe, ...symbolsToDfe};
    dfeToChar = {};
    for (const [char, code] of Object.entries(allToDfe)) dfeToChar[code] = char;
    sortedCodes = Object.keys(dfeToChar).sort((a, b) => b.length - a.length);
}
rebuildDicts();

// ==================== STATE ====================
const DFE = {
    mode: 'encode',
    history: [],
    stats: { enc: 0, dec: 0, chars: 0, errors: 0 },
    lang: 'en',
    theme: 'dark',
    startTime: Date.now(),
    user: { name: 'Guest_User', balance: 1000000000, coins: 999999, avatar: '👤', achievements: [], level: 99, inventory: [] },
    settings: { autoConvert: true, sound: false, anim: true, historyLimit: 100 },
    undoStack: []
};

// ==================== LOCAL STORAGE ====================
function saveState() {
    try { localStorage.setItem('dfeState', JSON.stringify({
        history: DFE.history, stats: DFE.stats, lang: DFE.lang, theme: DFE.theme,
        user: DFE.user, settings: DFE.settings
    })); } catch(e) {}
}
function loadState() {
    try {
        const s = localStorage.getItem('dfeState');
        if (s) {
            const d = JSON.parse(s);
            if (d.history) DFE.history = d.history;
            if (d.stats) DFE.stats = d.stats;
            if (d.lang) DFE.lang = d.lang;
            if (d.theme) DFE.theme = d.theme;
            if (d.user) DFE.user = d.user;
            if (d.settings) DFE.settings = d.settings;
        }
    } catch(e) {}
}

// ==================== ENCODE / DECODE ====================
function encodeText(text) {
    const upper = text.toUpperCase();
    let result = '', unknown = [];
    for (const ch of upper) {
        if (allToDfe[ch] !== undefined) result += allToDfe[ch];
        else { unknown.push(ch); result += '[?' + ch + ']'; }
    }
    if (unknown.length) return { result, warning: '⚠ Skipped: ' + [...new Set(unknown)].join(' ') };
    return { result };
}

function decodeText(dfeStr) {
    let remaining = dfeStr, result = '', failsafe = 0;
    while (remaining.length > 0 && failsafe < 50000) {
        failsafe++;
        let matched = false;
        for (const code of sortedCodes) {
            if (remaining.startsWith(code)) {
                result += dfeToChar[code];
                remaining = remaining.slice(code.length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            DFE.stats.errors++;
            return { error: '❌ Error near: "' + remaining.slice(0, 12) + '..."' };
        }
    }
    return { result };
}

// ==================== HISTORY ====================
function addHistory(entry) {
    entry.time = new Date().toLocaleTimeString();
    entry.id = Date.now();
    if (DFE.history.length > 0 && DFE.history[0].from === entry.from && DFE.history[0].to === entry.to) return;
    DFE.history.unshift(entry);
    if (DFE.history.length > DFE.settings.historyLimit) DFE.history.pop();
    saveState();
}

function undoLast() {
    if (DFE.undoStack.length < 2) return { error: 'Nothing to undo' };
    DFE.undoStack.pop();
    return DFE.undoStack[DFE.undoStack.length - 1];
}

// ==================== CONVERSION ====================
function convert(direction, input) {
    if (direction === 'encode') {
        const r = encodeText(input);
        if (r.result) {
            DFE.stats.enc++;
            DFE.stats.chars += input.length;
            const entry = { dir: '→', from: input, to: r.result };
            DFE.undoStack.push(entry);
            addHistory(entry);
        }
        return r;
    } else {
        const r = decodeText(input);
        if (r.result) {
            DFE.stats.dec++;
            DFE.stats.chars += r.result.length;
            const entry = { dir: '←', from: input, to: r.result };
            DFE.undoStack.push(entry);
            addHistory(entry);
        }
        return r;
    }
}

// ==================== BULK ====================
function bulkConvert(direction, text) {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(l => {
        const r = direction === 'encode' ? encodeText(l.trim()) : decodeText(l.trim());
        return r.error ? 'ERR: ' + r.error : r.result;
    }).join('\n');
}

// ==================== USER ACTIONS ====================
function login(username) {
    DFE.user.name = username || 'User';
    DFE.user.avatar = ['🦊','🐼','🐱','🐶','🦄'][Math.floor(Math.random()*5)];
    DFE.user.balance += Math.floor(Math.random() * 1000000);
    if (!DFE.user.achievements.includes('Returning')) DFE.user.achievements.push('Returning');
    saveState();
    return DFE.user;
}

function register(username) {
    DFE.user.name = username || 'NewUser';
    DFE.user.avatar = '🐣';
    DFE.user.balance = 1000000;
    DFE.user.coins = 500;
    DFE.user.level = 1;
    DFE.user.achievements = ['Newcomer'];
    saveState();
    return DFE.user;
}

function donate(amount) {
    amount = Math.min(amount, DFE.user.balance);
    if (amount <= 0) return { error: 'Invalid amount' };
    DFE.user.balance -= amount;
    if (!DFE.user.achievements.includes('Philanthropist')) DFE.user.achievements.push('Philanthropist');
    saveState();
    return { success: true, amount };
}

function mineCoins() {
    const mined = Math.floor(Math.random() * 5000) + 100;
    DFE.user.coins += mined;
    DFE.user.balance += Math.floor(Math.random() * 50000);
    if (DFE.user.coins > 1000000 && !DFE.user.achievements.includes('Miner')) DFE.user.achievements.push('Miner');
    saveState();
    return { mined, balance: DFE.user.balance };
}

function purchaseItem(name, cost) {
    if (DFE.user.coins < cost) return { error: 'Not enough coins' };
    DFE.user.coins -= cost;
    DFE.user.inventory.push(name);
    saveState();
    return { success: true, name };
}

// ==================== EXPORT / IMPORT ====================
function exportAll() {
    return {
        version: '3.0',
        timestamp: new Date().toISOString(),
        dictionaries: { ruToDfe, enToDfe, digitsToDfe, symbolsToDfe },
        state: { history: DFE.history, stats: DFE.stats, lang: DFE.lang, theme: DFE.theme, user: DFE.user, settings: DFE.settings }
    };
}

function importAll(data) {
    if (!data || !data.state) return { error: 'Invalid data' };
    if (data.dictionaries) {
        Object.assign(ruToDfe, data.dictionaries.ruToDfe || {});
        Object.assign(enToDfe, data.dictionaries.enToDfe || {});
        if (data.dictionaries.digitsToDfe) digitsToDfe = data.dictionaries.digitsToDfe;
        if (data.dictionaries.symbolsToDfe) symbolsToDfe = data.dictionaries.symbolsToDfe;
        rebuildDicts();
    }
    if (data.state.history) DFE.history = data.state.history;
    if (data.state.stats) DFE.stats = data.state.stats;
    if (data.state.lang) DFE.lang = data.state.lang;
    if (data.state.theme) DFE.theme = data.state.theme;
    if (data.state.user) DFE.user = data.state.user;
    if (data.state.settings) DFE.settings = data.state.settings;
    saveState();
    return { success: true };
}

// ==================== INIT ====================
loadState();
console.log('🚀 DFE! Engine v3.0 ready');
console.log('📚 Symbols: ' + Object.keys(allToDfe).length);
console.log('👤 User: ' + DFE.user.name);
