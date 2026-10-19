# Снимок окон процесса 1cv8t через PrintWindow (окна Claude поверх не попадают в кадр).
# -List: показать окна.  -Out файл -Handle N (или самое большое окно) [-Crop "x,y,w,h" в пикселях окна]
param([string]$Out, [string]$Handle, [string]$Crop, [switch]$List)
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text; using System.Collections.Generic;
public class W {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public static List<IntPtr> All(uint pid) { var r = new List<IntPtr>();
    EnumWindows((h,l)=>{ uint p; GetWindowThreadProcessId(h, out p); if (p==pid && IsWindowVisible(h)) r.Add(h); return true; }, IntPtr.Zero); return r; }
}
"@
[W]::SetProcessDPIAware() | Out-Null
$wins = @()
foreach ($p in Get-Process 1cv8t -ErrorAction SilentlyContinue) {
  foreach ($h in [W]::All([uint32]$p.Id)) {
    $sb = New-Object System.Text.StringBuilder 512; [W]::GetWindowText($h, $sb, 512) | Out-Null
    $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null
    $w = $r.R - $r.L; $hh = $r.B - $r.T
    if ($w -gt 50 -and $hh -gt 50) { $wins += [pscustomobject]@{H=[int64]$h; Title=$sb.ToString(); W=$w; Ht=$hh; L=$r.L; T=$r.T} }
  }
}
if ($List) { $wins | Format-Table -AutoSize | Out-String -Width 200; exit }
if ($Handle) { $t = $wins | Where-Object { $_.H -eq [int64]$Handle } } else { $t = $wins | Sort-Object { $_.W * $_.Ht } -Descending | Select-Object -First 1 }
$bmp = New-Object System.Drawing.Bitmap $t.W, $t.Ht
$g = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g.GetHdc()
[W]::PrintWindow([IntPtr]$t.H, $hdc, 2) | Out-Null
$g.ReleaseHdc($hdc); $g.Dispose()
if ($Crop) {
  $c = $Crop.Split(',') | ForEach-Object { [int]$_ }
  $rect = New-Object System.Drawing.Rectangle $c[0], $c[1], $c[2], $c[3]
  $bmp2 = $bmp.Clone($rect, $bmp.PixelFormat); $bmp.Dispose(); $bmp = $bmp2
}
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"saved $Out ($($t.Title))"
