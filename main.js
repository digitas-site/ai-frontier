(function () {
  "use strict";
  document.getElementById("year").textContent = new Date().getFullYear();

  // ----- スマホメニュー -----
  var menuBtn = document.getElementById("menu-btn");
  var gnav = document.getElementById("gnav");
  menuBtn.addEventListener("click", function () {
    var open = gnav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.querySelector("em").textContent = open ? "とじる" : "メニュー";
  });
  gnav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { gnav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.querySelector("em").textContent = "メニュー"; }
  });

  // ----- キャッチコピーを1文字ずつ表示 -----
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, ""));
    Array.from(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      Array.from(node.textContent.trim()).forEach(function (c) {
        var s = document.createElement("span");
        s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i++);
        s.setAttribute("aria-hidden", "true");
        frag.appendChild(s);
      });
      node.replaceWith(frag);
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { el.classList.add("on"); io.disconnect(); } });
      }, { threshold: 0.5 });
      io.observe(el);
    } else el.classList.add("on");
  });

  // ----- 追従ボタン（ヒーローを過ぎたら表示、フォーム付近では隠す） -----
  var floating = document.getElementById("floating");
  var hero = document.querySelector(".hero");
  var join = document.getElementById("join");
  function updFloat() {
    var pastHero = hero.getBoundingClientRect().bottom < 0;
    var r = join.getBoundingClientRect();
    var nearJoin = r.top < window.innerHeight && r.bottom > 0;
    floating.classList.toggle("show", pastHero && !nearJoin);
  }
  window.addEventListener("scroll", updFloat, { passive: true });
  updFloat();

  // ----- 個人情報ダイアログ -----
  var dialog = document.getElementById("privacy");
  document.querySelectorAll("[data-open='privacy']").forEach(function (b) {
    b.addEventListener("click", function () { dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", ""); });
  });
  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

  // ----- 会員登録フォーム -----
  var form = document.getElementById("join-form");
  var f = function (n) { return form.elements[n]; };
  var errorBox = document.getElementById("form-error");
  var submitBtn = document.getElementById("submit-btn");
  var done = document.getElementById("done");
  var endpoint = ((window.AIF_CONFIG && window.AIF_CONFIG.ENDPOINT) || "").trim();

  function showError(msg, el) {
    errorBox.textContent = msg; errorBox.hidden = false;
    if (el) { el.classList.add("is-invalid"); el.focus(); }
    return false;
  }
  form.addEventListener("input", function (e) { e.target.classList && e.target.classList.remove("is-invalid"); errorBox.hidden = true; });

  function validate() {
    if (!f("name").value.trim()) return showError("お名前を入力してください。", f("name"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f("email").value.trim())) return showError("メールアドレスを正しい形で入力してください（例：taro@example.com）。", f("email"));
    if (!f("area").value) return showError("お住まいの地域を選んでください。", f("area"));
    if (!form.querySelector("input[name='level']:checked")) return showError("AIとの付き合い方に近いものを選んでください。", form.querySelector("input[name='level']"));
    if (!form.querySelector("input[name='style']:checked")) return showError("参加しやすい形を選んでください。", form.querySelector("input[name='style']"));
    if (!f("agree").checked) return showError("個人情報の取り扱いへの同意にチェックを入れてください。", f("agree"));
    return true;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); errorBox.hidden = true;
    if (!validate()) return;
    if (f("website").value) return finish(); // スパム対策

    var data = new URLSearchParams();
    data.append("name", f("name").value.trim());
    data.append("email", f("email").value.trim());
    data.append("area", f("area").value);
    data.append("job", f("job").value);
    data.append("level", form.querySelector("input[name='level']:checked").value);
    data.append("interests", Array.from(form.querySelectorAll("input[name='interests']:checked")).map(function (i) { return i.value; }).join("、"));
    data.append("style", form.querySelector("input[name='style']:checked").value);
    data.append("message", f("message").value.trim());
    data.append("page", location.href);

    submitBtn.disabled = true; submitBtn.textContent = "登録しています…";

    if (!endpoint) {
      setTimeout(function () { finish("【お試しモード】まだ保存先が設定されていないため、この内容は保存されていません。js/config.js に保存先URLを設定すると本番運用になります。"); }, 600);
      return;
    }
    fetch(endpoint, { method: "POST", mode: "no-cors", body: data })
      .then(function () { finish(); })
      .catch(function () {
        submitBtn.disabled = false; submitBtn.textContent = "無料で会員登録する";
        showError("通信がうまくいきませんでした。電波の良い場所で、もう一度「無料で会員登録する」を押してください。");
      });
  });

  function finish(note) {
    form.hidden = true;
    if (note) document.getElementById("done-text").textContent = note;
    done.hidden = false; done.focus();
  }
})();
