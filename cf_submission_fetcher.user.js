// ==UserScript==
// @name         CF Submission Source Fetcher
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fetch and display source code from multiple Codeforces submissions — with Copy All
// @author       cthboss001
// @match        https://codeforces.com/contest/*/status*
// @match        https://codeforces.com/contest/*/status/*
// @match        https://codeforces.com/group/*/contest/*/status*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      codeforces.com
// ==/UserScript==

(function () {
    'use strict';

    // ── Styles ───────────────────────────────────────────────────────────────
    GM_addStyle(`
        #cf-fetcher-bar {
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 99999;
            background: #1e1e2e;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            font-family: monospace;
            font-size: 13px;
            color: #cdd6f4;
        }
        #cf-fetcher-bar button {
            padding: 6px 14px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 13px;
            font-family: monospace;
            font-weight: bold;
        }
        #cf-fetch-btn   { background: #89b4fa; color: #1e1e2e; }
        #cf-clear-btn   { background: #f38ba8; color: #1e1e2e; }
        #cf-selall-btn  { background: #a6e3a1; color: #1e1e2e; }
        #cf-fetcher-bar button:disabled { opacity: 0.5; cursor: not-allowed; }

        .cf-row-check {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #89b4fa;
        }

        #cf-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.80);
            z-index: 999999;
            justify-content: center;
            align-items: flex-start;
            padding: 30px 20px;
            overflow-y: auto;
        }
        #cf-modal-overlay.visible { display: flex; }

        #cf-modal {
            background: #1e1e2e;
            border: 1px solid #555;
            border-radius: 10px;
            width: 100%;
            max-width: 960px;
            padding: 20px;
            color: #cdd6f4;
            font-family: monospace;
            position: relative;
        }

        #cf-modal-topbar {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        #cf-modal-title {
            font-size: 16px;
            font-weight: bold;
            color: #89b4fa;
            flex: 1;
        }
        #cf-copy-all-btn {
            background: #cba6f7;
            color: #1e1e2e;
            border: none;
            border-radius: 5px;
            padding: 6px 16px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            font-family: monospace;
        }
        #cf-copy-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        #cf-modal-close {
            background: #f38ba8;
            color: #1e1e2e;
            border: none;
            border-radius: 5px;
            padding: 6px 14px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            font-family: monospace;
        }

        /* The single unified textarea shown when Copy All is ready */
        #cf-all-block {
            display: none;
            margin-bottom: 20px;
        }
        #cf-all-block textarea {
            width: 100%;
            height: 320px;
            background: #11111b;
            color: #cdd6f4;
            border: 1px solid #45475a;
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            font-family: monospace;
            line-height: 1.6;
            resize: vertical;
            box-sizing: border-box;
        }
        #cf-all-block-label {
            font-size: 12px;
            color: #a6adc8;
            margin-bottom: 6px;
        }

        .cf-submission-block {
            margin-bottom: 20px;
            border: 1px solid #313244;
            border-radius: 6px;
            overflow: hidden;
        }
        .cf-sub-header {
            background: #313244;
            padding: 8px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cf-sub-header span { font-size: 13px; color: #cba6f7; }
        .cf-copy-one-btn {
            background: #a6e3a1;
            color: #1e1e2e;
            border: none;
            border-radius: 4px;
            padding: 4px 12px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            font-family: monospace;
        }
        .cf-copy-one-btn:active { background: #74c7ec; }
        .cf-source-code {
            background: #181825;
            padding: 14px;
            font-size: 12px;
            line-height: 1.6;
            overflow-x: auto;
            white-space: pre;
            color: #cdd6f4;
            max-height: 350px;
            overflow-y: auto;
            margin: 0;
        }
        .cf-error-msg { color: #f38ba8; padding: 14px; font-size: 13px; }
        #cf-progress { font-size: 12px; color: #a6e3a1; min-width: 130px; }
    `);

    // ── Floating bar ─────────────────────────────────────────────────────────
    const bar = document.createElement('div');
    bar.id = 'cf-fetcher-bar';
    bar.innerHTML = `
        <span>⚡ CF Fetcher</span>
        <button id="cf-selall-btn">☑ Select All</button>
        <button id="cf-fetch-btn">⬇ Fetch Sources</button>
        <button id="cf-clear-btn">✕ Clear</button>
        <span id="cf-progress"></span>
    `;
    document.body.appendChild(bar);

    // ── Modal ─────────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'cf-modal-overlay';
    overlay.innerHTML = `
        <div id="cf-modal">
            <div id="cf-modal-topbar">
                <div id="cf-modal-title">📋 Submission Sources</div>
                <button id="cf-copy-all-btn" disabled>📄 Copy All</button>
                <button id="cf-modal-close">✕ Close</button>
            </div>
            <div id="cf-all-block">
                <div id="cf-all-block-label">↓ All solutions merged — select all (Ctrl+A inside) and copy, or use the button above</div>
                <textarea id="cf-all-textarea" readonly spellcheck="false"></textarea>
            </div>
            <div id="cf-modal-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('cf-modal-close').addEventListener('click', () => {
        overlay.classList.remove('visible');
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('visible');
    });

    // ── Inject checkboxes ─────────────────────────────────────────────────────
    function injectCheckboxes() {
        const table = document.querySelector('table.status-frame-datatable') ||
                      document.querySelector('.datatable table');
        if (!table) return;

        const headerRow = table.querySelector('tr');
        if (headerRow && !headerRow.querySelector('.cf-check-th')) {
            const th = document.createElement('th');
            th.className = 'cf-check-th';
            th.style.cssText = 'width:30px;text-align:center;';
            headerRow.insertBefore(th, headerRow.firstChild);
        }

        table.querySelectorAll('tr').forEach(row => {
            if (row.querySelector('.cf-check-td')) return;
            const idLink = row.querySelector('td:first-child a[href*="/submission/"]') ||
                           row.querySelector('td a[href*="/submission/"]');
            if (!idLink) return;
            const submissionId = idLink.href.match(/\/submission\/(\d+)/)?.[1];
            if (!submissionId) return;

            const cells = row.querySelectorAll('td');
            const td = document.createElement('td');
            td.className = 'cf-check-td';
            td.style.cssText = 'text-align:center;vertical-align:middle;';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'cf-row-check';
            cb.dataset.subId = submissionId;
            cb.dataset.who  = cells[2]?.innerText?.trim() || '';
            cb.dataset.prob = cells[3]?.innerText?.trim() || '';

            td.appendChild(cb);
            row.insertBefore(td, row.firstChild);
        });
    }

    injectCheckboxes();
    new MutationObserver(injectCheckboxes).observe(document.body, { childList: true, subtree: true });

    // ── Select All ────────────────────────────────────────────────────────────
    document.getElementById('cf-selall-btn').addEventListener('click', () => {
        const boxes = document.querySelectorAll('.cf-row-check');
        const allOn = [...boxes].every(c => c.checked);
        boxes.forEach(c => c.checked = !allOn);
        document.getElementById('cf-selall-btn').textContent = allOn ? '☑ Select All' : '☐ Deselect All';
    });

    // ── Clear ─────────────────────────────────────────────────────────────────
    document.getElementById('cf-clear-btn').addEventListener('click', () => {
        document.querySelectorAll('.cf-row-check').forEach(c => c.checked = false);
        document.getElementById('cf-progress').textContent = '';
        document.getElementById('cf-selall-btn').textContent = '☑ Select All';
    });

    // ── Fetch one submission ──────────────────────────────────────────────────
    function fetchSource(submissionId) {
        return new Promise((resolve) => {
            const contestMatch = location.href.match(/contest\/(\d+)/);
            const contestId = contestMatch ? contestMatch[1] : null;
            const url = contestId
                ? `https://codeforces.com/contest/${contestId}/submission/${submissionId}`
                : `https://codeforces.com/submission/${submissionId}`;

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload(res) {
                    if (res.status !== 200) {
                        resolve({ id: submissionId, error: `HTTP ${res.status}` });
                        return;
                    }
                    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');

                    let code =
                        doc.querySelector('#program-source-text')?.textContent ||
                        doc.querySelector('pre#program-source-text')?.textContent ||
                        doc.querySelector('.source-code')?.textContent ||
                        null;

                    if (!code) {
                        for (const pre of doc.querySelectorAll('pre')) {
                            const t = pre.textContent;
                            if (t.includes('#include') || t.includes('import ') || t.includes('def ') || t.includes('public class')) {
                                code = t;
                                break;
                            }
                        }
                    }

                    if (!code || code.trim().length < 10) {
                        resolve({ id: submissionId, error: 'Source not found — are you logged in to Codeforces?' });
                        return;
                    }
                    resolve({ id: submissionId, code: code.trim() });
                },
                onerror() {
                    resolve({ id: submissionId, error: 'Network error' });
                }
            });
        });
    }

    // ── Copy All button ───────────────────────────────────────────────────────
    document.getElementById('cf-copy-all-btn').addEventListener('click', function () {
        const ta = document.getElementById('cf-all-textarea');
        if (!ta.value) return;
        navigator.clipboard.writeText(ta.value).then(() => {
            this.textContent = '✓ Copied!';
            setTimeout(() => this.textContent = '📄 Copy All', 2000);
        });
    });

    // ── Main fetch flow ───────────────────────────────────────────────────────
    document.getElementById('cf-fetch-btn').addEventListener('click', async () => {
        const selected = [...document.querySelectorAll('.cf-row-check:checked')];
        if (selected.length === 0) {
            alert('No submissions selected. Tick the checkboxes on the left first.');
            return;
        }

        const fetchBtn   = document.getElementById('cf-fetch-btn');
        const progress   = document.getElementById('cf-progress');
        const modalBody  = document.getElementById('cf-modal-body');
        const allBlock   = document.getElementById('cf-all-block');
        const allTA      = document.getElementById('cf-all-textarea');
        const copyAllBtn = document.getElementById('cf-copy-all-btn');

        fetchBtn.disabled = true;
        fetchBtn.textContent = '⏳ Fetching…';
        copyAllBtn.disabled = true;
        modalBody.innerHTML = '';
        allBlock.style.display = 'none';
        allTA.value = '';
        overlay.classList.add('visible');

        const allParts = [];   // accumulate for the unified block

        for (let i = 0; i < selected.length; i++) {
            const cb    = selected[i];
            const subId = cb.dataset.subId;
            const who   = cb.dataset.who  || '?';
            const prob  = cb.dataset.prob || '?';

            progress.textContent = `Fetching ${i + 1} / ${selected.length}…`;

            const result = await fetchSource(subId);

            // ── Individual block ──────────────────────────────────────────
            const block = document.createElement('div');
            block.className = 'cf-submission-block';

            if (result.error) {
                block.innerHTML = `
                    <div class="cf-sub-header">
                        <span>#${subId} — ${who} — ${prob}</span>
                    </div>
                    <div class="cf-error-msg">⚠ ${result.error}</div>
                `;
                allParts.push(`/* ===== SUBMISSION #${subId} | ${who} | ${prob} ===== */\n// ERROR: ${result.error}\n`);
            } else {
                const escaped = result.code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                block.innerHTML = `
                    <div class="cf-sub-header">
                        <span>#${subId} — ${who} — ${prob}</span>
                        <button class="cf-copy-one-btn">📋 Copy This</button>
                    </div>
                    <pre class="cf-source-code">${escaped}</pre>
                `;
                block.querySelector('.cf-copy-one-btn').addEventListener('click', function () {
                    navigator.clipboard.writeText(result.code).then(() => {
                        this.textContent = '✓ Copied!';
                        setTimeout(() => this.textContent = '📋 Copy This', 1500);
                    });
                });

                // Build the "all" chunk with a clear separator for AI readability
                allParts.push(
`/* ================================================================
   SUBMISSION #${subId}
   Author  : ${who}
   Problem : ${prob}
================================================================ */

${result.code}
`
                );
            }

            modalBody.appendChild(block);

            // 2 second delay between requests
            if (i < selected.length - 1) {
                let remaining = 2;
                progress.textContent = `Waiting ${remaining}s before next…`;
                await new Promise(r => setTimeout(r, 500));
                remaining = 2;
                const tick = setInterval(() => {
                    remaining -= 0.5;
                    if (remaining > 0) {
                        progress.textContent = `Waiting ${remaining.toFixed(1)}s before next…`;
                    } else {
                        clearInterval(tick);
                    }
                }, 500);
                await new Promise(r => setTimeout(r, 2000));
                clearInterval(tick);
            }
        }

        // ── Build unified textarea ────────────────────────────────────────
        const separator = '\n\n' + '='.repeat(64) + '\n\n';
        allTA.value = allParts.join(separator);
        allBlock.style.display = 'block';
        copyAllBtn.disabled = false;

        progress.textContent = `✓ Done (${selected.length})`;
        fetchBtn.disabled = false;
        fetchBtn.textContent = '⬇ Fetch Sources';

        // Scroll modal to top so Copy All button is visible
        document.getElementById('cf-modal').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

})();
