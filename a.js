// ============================================================
//  DuitKu — Pengelolaan Keuangan Pribadi
//  JavaScript Module
// ============================================================

// ── DATA ────────────────────────────────────────────────────
var transaksi = JSON.parse(localStorage.getItem('duitku_trx') || '[]');
var targets   = JSON.parse(localStorage.getItem('duitku_targets') || '[]');

// ── SIMPAN KE LOCALSTORAGE ──────────────────────────────────
function simpan() {
  try {
    localStorage.setItem('duitku_trx', JSON.stringify(transaksi));
    localStorage.setItem('duitku_targets', JSON.stringify(targets));
  } catch (e) {
    console.error('Gagal menyimpan data:', e);
  }
}

// ── FORMAT RUPIAH ───────────────────────────────────────────
function fmt(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

// ── FORMAT TANGGAL ──────────────────────────────────────────
function fmtTanggal(date) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ============================================================
//  NAVIGASI / PANEL
// ============================================================
function showPanel(id, el) {
  // Sembunyikan semua panel
  document.querySelectorAll('.panel').forEach(function(p) {
    p.classList.remove('active');
  });
  // Nonaktifkan semua nav item
  document.querySelectorAll('.nav-item').forEach(function(n) {
    n.classList.remove('active');
  });

  // Tampilkan panel yang dipilih
  document.getElementById('panel-' + id).classList.add('active');
  if (el) el.classList.add('active');

  // Render konten sesuai panel
  if (id === 'target')   renderTarget();
  if (id === 'analisis') renderAnalisis();
}

// ============================================================
//  TRANSAKSI
// ============================================================

/**
 * Tambah transaksi baru dari form input
 */
function tambahTransaksi() {
  var jenis      = document.getElementById('jenis').value;
  var kategori   = document.getElementById('kategori').value;
  var jumlah     = parseFloat(document.getElementById('jumlah').value);
  var keterangan = document.getElementById('keterangan').value.trim();

  // Validasi input
  if (!jumlah || jumlah <= 0) {
    alert('Masukkan jumlah yang valid!');
    return;
  }

  // Buat objek transaksi baru
  var trxBaru = {
    id         : Date.now(),
    jenis      : jenis,
    kategori   : kategori,
    jumlah     : jumlah,
    keterangan : keterangan || '-',
    tanggal    : fmtTanggal(new Date())
  };

  // Simpan ke awal array (terbaru di atas)
  transaksi.unshift(trxBaru);
  simpan();
  renderTransaksi();

  // Reset form
  document.getElementById('jumlah').value     = '';
  document.getElementById('keterangan').value = '';
}

/**
 * Hapus transaksi berdasarkan ID
 */
function hapusTransaksi(id) {
  transaksi = transaksi.filter(function(t) { return t.id !== id; });
  simpan();
  renderTransaksi();
}

/**
 * Render tabel transaksi + hitung saldo otomatis
 */
function renderTransaksi() {
  // Hitung total pemasukan & pengeluaran
  var totalMasuk = transaksi
    .filter(function(t) { return t.jenis === 'masuk'; })
    .reduce(function(s, t) { return s + t.jumlah; }, 0);

  var totalKeluar = transaksi
    .filter(function(t) { return t.jenis === 'keluar'; })
    .reduce(function(s, t) { return s + t.jumlah; }, 0);

  var saldo = totalMasuk - totalKeluar;

  // Update kartu ringkasan
  document.getElementById('saldo').textContent       = fmt(saldo);
  document.getElementById('total-masuk').textContent = fmt(totalMasuk);
  document.getElementById('total-keluar').textContent = fmt(totalKeluar);

  var tbody = document.getElementById('tabel-transaksi');
  var empty = document.getElementById('empty-transaksi');
  var tbl   = document.getElementById('tabel-wrap');

  // Tampilkan pesan kosong jika belum ada data
  if (transaksi.length === 0) {
    empty.style.display = 'block';
    tbl.style.display   = 'none';
    return;
  }

  empty.style.display = 'none';
  tbl.style.display   = 'table';

  // Render baris tabel
  tbody.innerHTML = transaksi.map(function(t) {
    var ismasuk  = t.jenis === 'masuk';
    var badgeClass = ismasuk ? 'badge-in' : 'badge-out';
    var labelTeks  = ismasuk ? '↑ Pemasukan' : '↓ Pengeluaran';
    var warnaTeks  = ismasuk ? 'var(--green)' : 'var(--red)';
    var prefix     = ismasuk ? '+' : '-';

    return '<tr>' +
      '<td style="color:var(--muted)">' + t.tanggal + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + labelTeks + '</span></td>' +
      '<td>' + t.kategori + '</td>' +
      '<td style="color:var(--muted)">' + t.keterangan + '</td>' +
      '<td style="font-weight:600;color:' + warnaTeks + '">' + prefix + fmt(t.jumlah) + '</td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="hapusTransaksi(' + t.id + ')">Hapus</button></td>' +
      '</tr>';
  }).join('');
}

// ============================================================
//  TARGET TABUNGAN
// ============================================================

/**
 * Buat target tabungan baru
 */
function tambahTarget() {
  var nama    = document.getElementById('nama-target').value.trim();
  var jml     = parseFloat(document.getElementById('jml-target').value);
  var skrg    = parseFloat(document.getElementById('tabungan-skrg').value) || 0;
  var deadline = document.getElementById('deadline-target').value;

  if (!nama || !jml || jml <= 0) {
    alert('Nama dan jumlah target wajib diisi!');
    return;
  }

  targets.push({
    id         : Date.now(),
    nama       : nama,
    target     : jml,
    terkumpul  : skrg,
    deadline   : deadline
  });

  simpan();
  renderTarget();

  // Reset form
  document.getElementById('nama-target').value      = '';
  document.getElementById('jml-target').value       = '';
  document.getElementById('tabungan-skrg').value    = '';
  document.getElementById('deadline-target').value  = '';
}

/**
 * Tambah setoran ke target yang dipilih
 */
function tambahSetoran() {
  var idx = document.getElementById('pilih-target-setor').value;
  var jml = parseFloat(document.getElementById('jml-setor').value);

  if (!idx || !jml || jml <= 0) {
    alert('Pilih target dan masukkan jumlah setoran!');
    return;
  }

  var t = targets.find(function(t) { return t.id == idx; });
  if (t) {
    // Pastikan tidak melebihi target
    t.terkumpul = Math.min(t.target, t.terkumpul + jml);
  }

  simpan();
  renderTarget();
  document.getElementById('jml-setor').value = '';
}

/**
 * Hapus target berdasarkan ID
 */
function hapusTarget(id) {
  if (!confirm('Hapus target ini?')) return;
  targets = targets.filter(function(t) { return t.id !== id; });
  simpan();
  renderTarget();
}

/**
 * Render daftar target + dropdown setoran
 */
function renderTarget() {
  // Update dropdown pilih target
  var sel = document.getElementById('pilih-target-setor');
  sel.innerHTML = targets.length
    ? targets.map(function(t) {
        return '<option value="' + t.id + '">' + t.nama + '</option>';
      }).join('')
    : '<option>Belum ada target</option>';

  var el = document.getElementById('list-target');

  if (targets.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🎯</div>Belum ada target. Buat target pertama Anda!</div>';
    return;
  }

  el.innerHTML = targets.map(function(t) {
    var pct  = Math.min(100, (t.terkumpul / t.target) * 100);
    var done = pct >= 100;
    var sisa = t.target - t.terkumpul;

    var dlText = t.deadline
      ? 'Deadline: ' + fmtTanggal(new Date(t.deadline))
      : 'Tanpa batas waktu';

    return '<div class="target-card">' +
      '<div class="target-card-top">' +
        '<div>' +
          '<div class="target-name">' + t.nama + (done ? ' ✓' : '') + '</div>' +
          '<div class="target-deadline">' + dlText + '</div>' +
        '</div>' +
        '<button class="btn btn-sm btn-danger" onclick="hapusTarget(' + t.id + ')">Hapus</button>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px">' +
        '<span>' + fmt(t.terkumpul) + ' terkumpul</span>' +
        '<span>Target: ' + fmt(t.target) + '</span>' +
      '</div>' +
      '<div class="progress-bar">' +
        '<div class="progress-fill ' + (done ? 'done' : '') + '" style="width:' + pct.toFixed(1) + '%"></div>' +
      '</div>' +
      '<div class="target-nums">' +
        '<span class="pct ' + (done ? 'done' : '') + '">' + pct.toFixed(1) + '%</span>' +
        '<span class="sisa">' + (done ? '🎉 Target tercapai!' : 'Kurang ' + fmt(sisa)) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ============================================================
//  SIMULASI PERTUMBUHAN TABUNGAN
// ============================================================

/**
 * Hitung simulasi compound interest bulanan
 * Rumus: B = P*(1+r)^n + PMT * (((1+r)^n - 1) / r)
 *   P   = modal awal
 *   PMT = tabungan per bulan
 *   r   = bunga per bulan
 *   n   = jumlah bulan
 */
function hitungSimulasi() {
  var modal   = parseFloat(document.getElementById('sim-modal').value)   || 0;
  var bulanan = parseFloat(document.getElementById('sim-bulanan').value) || 0;
  var bunga   = parseFloat(document.getElementById('sim-bunga').value)   || 0;
  var tahun   = parseInt(document.getElementById('sim-tahun').value)     || 5;

  var r = bunga / 100 / 12;  // bunga bulanan
  var data = [];
  var bal  = modal;

  // Hitung saldo akhir tiap tahun
  for (var y = 1; y <= tahun; y++) {
    for (var m = 0; m < 12; m++) {
      bal = bal * (1 + r) + bulanan;
    }
    data.push(Math.round(bal));
  }

  var totalModal  = modal + (bulanan * 12 * tahun);
  var totalAkhir  = data[data.length - 1];
  var totalBunga  = totalAkhir - totalModal;
  var growth      = totalModal > 0 ? ((totalAkhir - totalModal) / totalModal * 100) : 0;

  // Tampilkan ringkasan hasil
  document.getElementById('r-total').textContent  = fmt(totalAkhir);
  document.getElementById('r-bunga').textContent  = fmt(totalBunga);
  document.getElementById('r-modal').textContent  = fmt(totalModal);
  document.getElementById('r-growth').textContent = growth.toFixed(1) + '%';

  // Gambar grafik batang
  var maxVal  = Math.max.apply(null, data);
  var chartEl = document.getElementById('sim-chart');

  chartEl.innerHTML = data.map(function(v, i) {
    var h = Math.max(8, Math.round((v / maxVal) * 150));
    return '<div class="chart-bar" style="height:' + h + 'px" data-tip="Tahun ' + (i + 1) + ': ' + fmt(v) + '"></div>';
  }).join('');

  document.getElementById('sim-result').style.display = 'block';
  document.getElementById('sim-empty').style.display  = 'none';
}

// ============================================================
//  ANALISIS KEBIASAAN PENGELUARAN
// ============================================================

// Palet warna untuk kategori
var CAT_COLORS = [
  '#7c6ef7', '#34d399', '#f87171', '#60a5fa',
  '#fbbf24', '#a78bfa', '#6ee7b7', '#fca5a5'
];

/**
 * Render seluruh konten analisis pengeluaran
 */
function renderAnalisis() {
  var el     = document.getElementById('analisis-content');
  var keluar = transaksi.filter(function(t) { return t.jenis === 'keluar'; });

  if (keluar.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div>Tambahkan transaksi pengeluaran terlebih dahulu untuk melihat analisis.</div>';
    return;
  }

  var totalKeluar = keluar.reduce(function(s, t) { return s + t.jumlah; }, 0);
  var totalMasuk  = transaksi
    .filter(function(t) { return t.jenis === 'masuk'; })
    .reduce(function(s, t) { return s + t.jumlah; }, 0);

  // Kelompokkan pengeluaran per kategori
  var byKat = {};
  keluar.forEach(function(t) {
    byKat[t.kategori] = (byKat[t.kategori] || 0) + t.jumlah;
  });

  // Urutkan dari terbesar
  var sorted = Object.entries(byKat).sort(function(a, b) { return b[1] - a[1]; });
  var totalKat = sorted.reduce(function(s, x) { return s + x[1]; }, 0);

  // Rasio pengeluaran terhadap pemasukan
  var rasio = totalMasuk > 0 ? (totalKeluar / totalMasuk * 100) : 100;

  // Tentukan warna & pesan saran
  var warnaRasio, insightClass, insightText;
  if (rasio < 50) {
    warnaRasio   = 'var(--green)';
    insightClass = '';
    insightText  = '💚 Pengeluaran Anda sangat terkontrol. Pertahankan kebiasaan baik ini!';
  } else if (rasio < 80) {
    warnaRasio   = 'var(--amber)';
    insightClass = 'warn';
    insightText  = '⚠️ Pengeluaran cukup terkontrol, namun masih bisa ditingkatkan lagi.';
  } else {
    warnaRasio   = 'var(--red)';
    insightClass = 'danger';
    insightText  = '🔴 Pengeluaran terlalu tinggi dibanding pemasukan. Pertimbangkan untuk mengurangi.';
  }

  // Gambar Pie Chart SVG (donut style)
  var pieHTML = buatPieChart(sorted, totalKat);

  // Render semua konten analisis
  el.innerHTML =
    // Kartu ringkasan 3 kolom
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:1.25rem">' +
      '<div class="metric-card keluar"><div class="metric-label">Total Pengeluaran</div><div class="metric-val red">' + fmt(totalKeluar) + '</div></div>' +
      '<div class="metric-card masuk"><div class="metric-label">Total Pemasukan</div><div class="metric-val green">' + fmt(totalMasuk) + '</div></div>' +
      '<div class="metric-card saldo"><div class="metric-label">Rasio Pengeluaran</div><div class="metric-val" style="color:' + warnaRasio + '">' + rasio.toFixed(1) + '%</div></div>' +
    '</div>' +

    // Kotak saran
    '<div class="insight-card ' + insightClass + '">' + insightText + '</div>' +

    // Grid: pie chart + bar chart
    '<div class="analisis-grid">' +
      '<div class="form-card">' +
        '<div class="form-card-title">Distribusi Pengeluaran</div>' +
        '<div class="pie-container">' +
          '<div class="pie-wrap">' + pieHTML + '</div>' +
          '<div class="legend">' +
            sorted.map(function(x, i) {
              var pct = (x[1] / totalKat * 100).toFixed(1);
              return '<div class="legend-item">' +
                '<div class="legend-dot" style="background:' + CAT_COLORS[i % CAT_COLORS.length] + '"></div>' +
                '<span class="legend-name">' + x[0] + '</span>' +
                '<span class="legend-pct">' + pct + '%</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="form-card">' +
        '<div class="form-card-title">Detail Per Kategori</div>' +
        sorted.map(function(x, i) {
          var pct = (x[1] / totalKat * 100).toFixed(1);
          var w   = Math.round((x[1] / sorted[0][1]) * 100);
          return '<div class="kat-bar-item">' +
            '<div class="kat-bar-top">' +
              '<span style="font-weight:500">' + x[0] + '</span>' +
              '<span style="color:var(--muted)">' + fmt(x[1]) + ' · ' + pct + '%</span>' +
            '</div>' +
            '<div class="kat-bar-track">' +
              '<div class="kat-bar-fill" style="width:' + w + '%;background:' + CAT_COLORS[i % CAT_COLORS.length] + '"></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

/**
 * Buat SVG donut pie chart
 * @param {Array} sorted - Array [nama, nilai] terurut descending
 * @param {number} totalKat - Total nilai semua kategori
 * @returns {string} SVG HTML string
 */
function buatPieChart(sorted, totalKat) {
  var cx = 90, cy = 90, r = 70, innerR = 42;
  var startAngle = -Math.PI / 2;

  var slices = sorted.map(function(x, i) {
    var angle = (x[1] / totalKat) * 2 * Math.PI;

    var x1 = cx + r * Math.cos(startAngle);
    var y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    var x2 = cx + r * Math.cos(startAngle);
    var y2 = cy + r * Math.sin(startAngle);

    var ix1 = cx + innerR * Math.cos(startAngle - angle);
    var iy1 = cy + innerR * Math.sin(startAngle - angle);
    var ix2 = cx + innerR * Math.cos(startAngle);
    var iy2 = cy + innerR * Math.sin(startAngle);

    var large = angle > Math.PI ? 1 : 0;

    // Path: luar searah jarum jam, dalam berlawanan
    var d = 'M' + ix1 + ',' + iy1 +
            ' L' + x1  + ',' + y1  +
            ' A' + r + ',' + r + ',0,' + large + ',1,' + x2 + ',' + y2 +
            ' L' + ix2 + ',' + iy2 +
            ' A' + innerR + ',' + innerR + ',0,' + large + ',0,' + ix1 + ',' + iy1 +
            ' Z';

    return '<path d="' + d + '" fill="' + CAT_COLORS[i % CAT_COLORS.length] + '" stroke="var(--bg)" stroke-width="2"/>';
  });

  return '<svg width="180" height="180" viewBox="0 0 180 180">' + slices.join('') + '</svg>';
}

// ============================================================
//  INISIALISASI
// ============================================================
renderTransaksi();
renderTarget();