/**
 * AIフロンティア 会員登録の受け口（Google Apps Script）
 * 登録内容をこのスプレッドシートに1行ずつ追記し、登録者に確認メールを送ります。
 * 設置手順は README.md を参照してください。
 */

const SHEET_NAME = "会員";
const SEND_CONFIRM_MAIL = true;          // 確認メールを送らない場合は false
const NOTIFY_TO = "";                    // 運営への通知先（例："info@example.com"）。空なら通知なし
const FROM_NAME = "AIフロンティア事務局";

const HEADERS = ["登録日時", "お名前", "メールアドレス", "地域", "職業", "AIとの付き合い方", "興味のあるテーマ", "参加形態", "ひとこと", "登録ページ"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const p = e.parameter || {};
    const email = String(p.email || "").trim();
    if (!p.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: "invalid" });
    }

    const sheet = getSheet();
    // 同じメールアドレスの二重登録を防ぐ
    const last = sheet.getLastRow();
    if (last > 1) {
      const emails = sheet.getRange(2, 3, last - 1, 1).getValues().flat().map(String);
      if (emails.indexOf(email) !== -1) return json({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      new Date(), clean(p.name), email, clean(p.area), clean(p.job), clean(p.level),
      clean(p.interests), clean(p.style), clean(p.message), clean(p.page)
    ]);

    if (SEND_CONFIRM_MAIL) {
      MailApp.sendEmail({
        to: email,
        name: FROM_NAME,
        subject: "【AIフロンティア】会員登録ありがとうございます",
        body:
          clean(p.name) + " 様\n\n" +
          "AIフロンティア（次世代AI研究会）への会員登録ありがとうございます。\n" +
          "月1回の情報交換会の日程が決まりましたら、このメールアドレスにご案内をお送りします。\n\n" +
          "退会をご希望の場合は、このメールにそのままご返信ください。\n\n" +
          "――\nAIフロンティア 事務局\n運営：株式会社デジたす https://digitas-w.com/\n"
      });
    }
    if (NOTIFY_TO) {
      MailApp.sendEmail(NOTIFY_TO, "【AIフロンティア】新しい会員登録：" + clean(p.name),
        HEADERS.slice(1).map(function (h, i) {
          return h + "：" + [p.name, email, p.area, p.job, p.level, p.interests, p.style, p.message, p.page][i];
        }).join("\n"));
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#EAF6FC");
  }
  return sheet;
}

// 表計算の数式として解釈されないよう、先頭の = + - @ を無害化
function clean(v) {
  v = String(v || "").slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
