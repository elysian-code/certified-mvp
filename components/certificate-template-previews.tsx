
import React from "react";

const aspectRatio = 800 / 568; // A4 height/width from image
const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "340px",
  aspectRatio: `568 / 800`, // width / height
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

export function ClassicCertificatePreview() {
  return (
    <div style={containerStyle}>
      <div style={{
    width: "100%",
    height: "100%",
    background: "url(/templates/classic.png) center/cover no-repeat",
    border: "10px solid #d4af37",
    borderRadius: "24px",
    boxShadow: "0 12px 40px #d4af3733, 0 2px 8px #fff inset",
    fontFamily: "'Playfair Display', 'Roboto', serif",
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  }}>
    <div style={{ textAlign: "center", color: "#d4af37", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.7em", letterSpacing: "2px", marginBottom: "10px", textShadow: "0 2px 8px #d4af3722, 0 1px 0 #fff" }}>
      <span style={{background: "linear-gradient(90deg, #d4af37 60%, #fff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>Certificate of Completion</span>
    </div>
    <div style={{ textAlign: "center", margin: "12px 0", background: "rgba(255,255,255,0.7)", borderRadius: "12px", boxShadow: "0 1px 8px #d4af3711" }}>
      <div style={{ fontSize: "1.1em", color: "#444", fontFamily: "'Roboto', sans-serif" }}>This certifies that</div>
      <div style={{ fontWeight: 700, fontSize: "1.35em", color: "#222", margin: "6px 0", fontFamily: "'Playfair Display', serif", letterSpacing: "1px" }}>[Name]</div>
      <div style={{ fontSize: "1.05em", color: "#666" }}>has successfully completed the program</div>
      <div style={{ fontWeight: 700, color: "#4F8EF7", fontSize: "1.15em", margin: "6px 0", letterSpacing: "1px" }}>[Program]</div>
      <div style={{ fontSize: "1.05em", color: "#888" }}>on <span>[Date]</span></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "1em", marginTop: "16px" }}>
      <div style={{ color: "#bfae7c", fontWeight: 500 }}>Certificate ID: <strong style={{color: "#222"}}>[ID]</strong></div>
      <div style={{ width: 38, height: 38, background: "#fffbe6", borderRadius: 12, boxShadow: "0 2px 8px #d4af3722", border: "2px solid #d4af37", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{fontSize: "1.2em", color: "#d4af37", fontWeight: 700}}>QR</span>
      </div>
    </div>
    <div style={{position: "absolute", bottom: 18, right: 24, fontSize: "0.9em", color: "#bfae7c", fontFamily: "cursive", fontWeight: 600, letterSpacing: "1px"}}>
      Signature
    </div>
    <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none"}}>
      <svg width="100%" height="100%" viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: "absolute", top: 0, left: 0}}>
        <rect x="12" y="12" width="316" height="216" rx="18" stroke="#d4af37" strokeWidth="2.5" fill="none" />
        <rect x="24" y="24" width="292" height="192" rx="12" stroke="#fff" strokeWidth="1.5" fill="none" />
      </svg>
    </div>

      </div>
    </div>
  );
}
export function ModernCertificatePreview() {
  return (
    <div style={containerStyle}>
      <div style={{
    width: "100%",
    height: "100%",
    background: "url(/templates/modern.png) center/cover no-repeat",
    border: "6px solid #fff",
    borderRadius: "28px",
    boxShadow: "0 12px 40px #4f8ef733, 0 2px 8px #fff inset",
    fontFamily: "'Montserrat', 'Roboto', sans-serif",
    padding: "30px 26px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  }}>
    <div style={{ textAlign: "center", color: "#fff", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "1.8em", letterSpacing: "2.5px", marginBottom: "12px", textShadow: "0 2px 12px #4f8ef7cc, 0 1px 0 #fff" }}>
      <span style={{background: "linear-gradient(90deg, #fff 60%, #4F8EF7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>CERTIFICATE</span>
    </div>
    <div style={{ textAlign: "center", margin: "14px 0", background: "rgba(255,255,255,0.15)", borderRadius: "14px", boxShadow: "0 1px 8px #4f8ef711" }}>
      <div style={{ fontSize: "1.15em", color: "#fff", fontFamily: "'Roboto', sans-serif" }}>Awarded to</div>
      <div style={{ fontWeight: 700, fontSize: "1.4em", color: "#222", margin: "8px 0", background: "#fff", borderRadius: "8px", padding: "4px 12px", display: "inline-block", boxShadow: "0 1px 8px #4f8ef711" }}>[Name]</div>
      <div style={{ fontSize: "1.1em", color: "#fff" }}>for completing</div>
      <div style={{ fontWeight: 700, color: "#fff", fontSize: "1.2em", margin: "8px 0", textShadow: "0 1px 6px #4f8ef7" }}>[Program]</div>
      <div style={{ fontSize: "1.1em", color: "#e0eaff" }}>on <span>[Date]</span></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "1.05em", marginTop: "18px" }}>
      <div style={{ color: "#e0eaff", fontWeight: 500, textShadow: "0 1px 4px #4f8ef7" }}>Certificate ID: <strong style={{color: "#fff"}}>[ID]</strong></div>
      <div style={{ width: 40, height: 40, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #4f8ef722", border: "2px solid #4F8EF7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{fontSize: "1.3em", color: "#4F8EF7", fontWeight: 700}}>QR</span>
      </div>
    </div>
    <div style={{position: "absolute", bottom: 22, right: 32, fontSize: "1em", color: "#e0eaff", fontFamily: "cursive", fontWeight: 600, letterSpacing: "1px", textShadow: "0 1px 4px #4f8ef7"}}>
      Signature
    </div>
    <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none"}}>
      <svg width="100%" height="100%" viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: "absolute", top: 0, left: 0}}>
        <rect x="16" y="16" width="308" height="208" rx="22" stroke="#fff" strokeWidth="2.5" fill="none" />
        <rect x="32" y="32" width="276" height="176" rx="14" stroke="#4F8EF7" strokeWidth="1.5" fill="none" />
      </svg>
    </div>

      </div>
    </div>
  );
}
export function MinimalCertificatePreview() {
  return (
    <div style={containerStyle}>
      <div style={{
    width: "100%",
    height: "100%",
    background: "url(/templates/minimal.png) center/cover no-repeat",
    border: "4px solid #888",
    borderRadius: "20px",
    boxShadow: "0 8px 24px #8882, 0 2px 8px #fff inset",
    fontFamily: "'Roboto', sans-serif",
    padding: "26px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  }}>
    <div style={{ textAlign: "center", color: "#888", fontWeight: 700, fontSize: "1.3em", marginBottom: "10px", letterSpacing: "1.5px", textShadow: "0 1px 0 #fff, 0 2px 8px #8882" }}>
      Certificate
    </div>
    <div style={{ textAlign: "center", margin: "12px 0", background: "rgba(255,255,255,0.7)", borderRadius: "12px", boxShadow: "0 1px 8px #8881" }}>
      <div style={{ fontSize: "1.05em", color: "#444", fontFamily: "'Roboto', sans-serif" }}>Recipient:</div>
      <div style={{ fontWeight: 700, fontSize: "1.25em", color: "#222", margin: "6px 0", letterSpacing: "1px" }}>[Name]</div>
      <div style={{ fontSize: "1.05em", color: "#666" }}>Program:</div>
      <div style={{ fontWeight: 700, color: "#888", fontSize: "1.1em", margin: "6px 0", letterSpacing: "1px" }}>[Program]</div>
      <div style={{ fontSize: "1.05em", color: "#888" }}>Completed on <span>[Date]</span></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "1em", marginTop: "16px" }}>
      <div style={{ color: "#888", fontWeight: 500 }}>Certificate ID: <strong style={{color: "#222"}}>[ID]</strong></div>
      <div style={{ width: 38, height: 38, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #8882", border: "2px solid #888", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{fontSize: "1.2em", color: "#888", fontWeight: 700}}>QR</span>
      </div>
    </div>
    <div style={{position: "absolute", bottom: 18, right: 24, fontSize: "0.9em", color: "#888", fontFamily: "cursive", fontWeight: 600, letterSpacing: "1px"}}>
      Signature
    </div>
    <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none"}}>
      <svg width="100%" height="100%" viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: "absolute", top: 0, left: 0}}>
        <rect x="10" y="10" width="320" height="220" rx="16" stroke="#888" strokeWidth="2.5" fill="none" />
        <rect x="24" y="24" width="292" height="192" rx="10" stroke="#fff" strokeWidth="1.5" fill="none" />
      </svg>
    </div>

      </div>
    </div>
  );
}
