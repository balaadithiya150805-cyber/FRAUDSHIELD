import streamlit as st
import requests
import os
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import json

st.set_page_config(page_title="FraudShield AI", layout="wide", page_icon="🛡️")

# ── Custom CSS ──
st.markdown("""
<style>
    .stApp { background-color: #f8fafc; color: #0f172a; }
    [data-testid="stSidebar"] { background-color: #0f172a; }
    [data-testid="stSidebarNav"] { display: none; }
    [data-testid="stMetricValue"] { font-size: 1.8rem; font-weight: bold; }
    h1, h2, h3 { font-family: 'Inter', sans-serif; }

    .confusion-container {
        display: grid; grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem; text-align: center; max-width: 500px; margin: 0 auto;
    }
    .confusion-box { padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
    .confusion-tn { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); }
    .confusion-fp { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2); }
    .confusion-fn { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }
    .confusion-tp { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); }
</style>
""", unsafe_allow_html=True)

BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


def api_get(path):
    """GET request to backend, return JSON or None."""
    try:
        r = requests.get(f"{BACKEND}/{path}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        st.error(f"API error ({path}): {e}")
        return None


def api_post(path, **kwargs):
    """POST request to backend, return JSON or None."""
    try:
        r = requests.post(f"{BACKEND}/{path}", timeout=120, **kwargs)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        st.error(f"API error ({path}): {e}")
        return None


# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────
def show_dashboard():
    st.markdown("### Dashboard")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>Real-time fraud detection overview</p>", unsafe_allow_html=True)

    data = api_get("dashboard")
    if data is None or not data.get("loaded"):
        st.info("No data loaded yet. Go to **Upload Transactions** to load sample data or upload a CSV.")
        return

    # Row 1 — main counters
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("TOTAL TRANSACTIONS", f"{data['total']:,}")
    c2.metric("FRAUD DETECTED", f"{data['fraud']:,}")
    c3.metric("LEGITIMATE", f"{data['legitimate']:,}")
    c4.metric("AVG RISK SCORE", data["avg_risk_score"])

    st.write("")

    # Row 2 — model metrics
    m = data.get("metrics", {})
    mc1, mc2, mc3, mc4, mc5 = st.columns(5)
    mc1.metric("ACCURACY", m.get("accuracy", "—"))
    mc2.metric("PRECISION", m.get("precision", "—"))
    mc3.metric("RECALL", m.get("recall", "—"))
    mc4.metric("F1 SCORE", m.get("f1_score", "—"))
    mc5.metric("ROC-AUC", m.get("roc_auc", "—"))

    st.write("")

    # Row 3 — charts
    chart1, chart2 = st.columns(2)
    with chart1:
        st.markdown("##### Fraud vs Legitimate Distribution")
        fig = go.Figure(data=[go.Pie(
            labels=["Fraud", "Legitimate"],
            values=[data["fraud"], data["legitimate"]],
            hole=0.5,
            marker_colors=["#ef4444", "#10b981"],
            textinfo="label+percent",
        )])
        fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=350, showlegend=True)
        st.plotly_chart(fig, use_container_width=True)

    with chart2:
        st.markdown("##### Risk Score Distribution")
        rd = data.get("risk_distribution", {})
        if rd:
            fig2 = go.Figure(data=[go.Bar(
                x=list(rd.keys()), y=list(rd.values()), marker_color="#2563eb"
            )])
            fig2.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=350)
            st.plotly_chart(fig2, use_container_width=True)


# ─────────────────────────────────────────────
# UPLOAD TRANSACTIONS
# ─────────────────────────────────────────────
def show_upload():
    st.markdown("### Upload Transactions")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>Upload CSV data for fraud detection</p>", unsafe_allow_html=True)

    uploaded_file = st.file_uploader(
        "Drop CSV file here or click to browse",
        type="csv",
        help="Required column: Amount. Optional: Time, V1-V28, Class",
    )

    col1, col2 = st.columns([1, 4])
    with col1:
        load_sample = st.button("📂 Load Sample Dataset", use_container_width=True)
    with col2:
        run_detection = st.button("▶ Run Fraud Detection", type="primary", use_container_width=False)

    # Handle Load Sample
    if load_sample:
        with st.spinner("Generating sample dataset and running fraud detection..."):
            result = api_post("load-sample")
        if result and result.get("status") == "success":
            st.success(f"Loaded {result['total']:,} transactions — {result['fraud']:,} fraud, {result['legitimate']:,} legitimate")
            st.session_state["data_loaded"] = True
        elif result:
            st.error(result.get("error", "Unknown error"))

    # Handle CSV Upload + Run Detection
    if run_detection and uploaded_file is not None:
        with st.spinner("Uploading and processing CSV..."):
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "text/csv")}
            result = api_post("upload", files=files)
        if result and result.get("status") == "success":
            st.success(f"Processed {result['total']:,} transactions — {result['fraud']:,} fraud, {result['legitimate']:,} legitimate")
            st.session_state["data_loaded"] = True
        elif result:
            st.error(result.get("error", "Unknown error"))
    elif run_detection and uploaded_file is None:
        st.warning("Please upload a CSV file first, or click Load Sample Dataset.")

    # Show results if data was loaded
    if st.session_state.get("data_loaded"):
        st.write("")
        data = api_get("dashboard")
        if data and data.get("loaded"):
            r1, r2 = st.columns(2)
            r1.metric("FRAUD DETECTED", f"{data['fraud']:,}")
            r2.metric("LEGITIMATE", f"{data['legitimate']:,}")

            st.markdown(f"##### Dataset Preview (50 of {data['total']:,} rows)")
            # Fetch a preview via reports summary
            summary = api_get("reports/summary")
            if summary and summary.get("loaded"):
                # Build a minimal preview table from transactions CSV
                try:
                    r = requests.get(f"{BACKEND}/reports/transactions-csv", timeout=30)
                    if r.status_code == 200:
                        from io import StringIO
                        preview_df = pd.read_csv(StringIO(r.text), nrows=50)
                        st.dataframe(preview_df, use_container_width=True, hide_index=True)
                except Exception:
                    pass


# ─────────────────────────────────────────────
# FRAUD ANALYSIS
# ─────────────────────────────────────────────
def show_fraud_analysis():
    st.markdown("### Fraud Analysis")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>Evaluate individual transactions via API</p>", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        amount = st.number_input("Amount ($)", min_value=0.0, value=120.50, step=10.0)
    with c2:
        time_val = st.number_input("Time (Hour 0-23)", min_value=0, max_value=23, value=14)
    with c3:
        tx_type = st.number_input("Transaction Type (0-4)", min_value=0, max_value=4, value=2)
    with c4:
        location = st.number_input("Location ID (0-50)", min_value=0, max_value=50, value=15)

    if st.button("Evaluate Transaction", type="primary"):
        payload = {"amount": amount, "time": time_val, "transaction_type": tx_type, "location": location}
        with st.spinner("Analyzing transaction..."):
            result = api_post("predict", json=payload)

        if result and "error" not in result:
            prob = result["probability"]
            risk = result["risk_level"]
            color = {"LOW": "#10b981", "MEDIUM": "#f59e0b", "HIGH": "#ef4444"}.get(risk, "#64748b")
            st.markdown(f"<h2 style='text-align:center;color:{color};'>Risk Level: {risk}</h2>", unsafe_allow_html=True)
            st.markdown(f"<p style='text-align:center;'>Fraud Probability: <strong>{prob:.2%}</strong></p>", unsafe_allow_html=True)
            if result["fraud"] == 1:
                st.error("🚨 ALERT: High probability of fraud detected! Block transaction.")
            else:
                st.success("✅ Transaction verified. Normal activity.")
        elif result:
            st.error(result.get("error", "Unknown error"))


# ─────────────────────────────────────────────
# MODEL INSIGHTS
# ─────────────────────────────────────────────
def show_model_insights():
    st.markdown("### Model Insights")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>XGBoost model performance and feature analysis</p>", unsafe_allow_html=True)

    data = api_get("model-insights")
    if data is None or not data.get("loaded"):
        st.info("No model data available. Load data from the **Upload Transactions** page first.")
        return

    # Feature importance
    st.markdown("##### Feature Importance (XGBoost)")
    fi = data["feature_importance"]
    features = [f["feature"] for f in fi]
    importances = [f["importance"] for f in fi]
    # Reverse for horizontal bar (bottom to top)
    fig = px.bar(x=importances[::-1], y=features[::-1], orientation="h", color_discrete_sequence=["#2563eb"])
    fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=400, xaxis_title="", yaxis_title="")
    st.plotly_chart(fig, use_container_width=True)

    # Confusion Matrix
    st.markdown("##### Confusion Matrix")
    cm = data.get("confusion", {})
    if cm:
        cm_html = f"""
        <div class="confusion-container">
            <div></div>
            <div style="color:#64748b;font-weight:bold;padding:10px;">Predicted Legit</div>
            <div style="color:#64748b;font-weight:bold;padding:10px;">Predicted Fraud</div>
            <div style="color:#64748b;font-weight:bold;align-self:center;text-align:right;padding-right:15px;">Actual Legit</div>
            <div class="confusion-box confusion-tn">
                <div style="font-size:0.8rem;color:#64748b;">TN</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#10b981;">{cm['tn']:,}</div>
            </div>
            <div class="confusion-box confusion-fp">
                <div style="font-size:0.8rem;color:#64748b;">FP</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#f59e0b;">{cm['fp']:,}</div>
            </div>
            <div style="color:#64748b;font-weight:bold;align-self:center;text-align:right;padding-right:15px;">Actual Fraud</div>
            <div class="confusion-box confusion-fn">
                <div style="font-size:0.8rem;color:#64748b;">FN</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#ef4444;">{cm['fn']:,}</div>
            </div>
            <div class="confusion-box confusion-tp">
                <div style="font-size:0.8rem;color:#64748b;">TP</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#10b981;">{cm['tp']:,}</div>
            </div>
        </div>
        """
        st.markdown(cm_html, unsafe_allow_html=True)

    st.write("")
    spw = data.get("settings", {}).get("scale_pos_weight", 50)
    st.info(
        f"**Cost-Sensitive Learning (scale_pos_weight = {spw})**\n\n"
        f"The model uses scale_pos_weight = {spw} to address class imbalance. "
        "This penalizes false negatives (missed fraud) 50× more than false positives, "
        "resulting in high recall at the cost of lower precision. This is ideal for fraud "
        "detection where missing fraudulent transactions is far more costly than flagging "
        "legitimate ones for review."
    )


# ─────────────────────────────────────────────
# REPORTS
# ─────────────────────────────────────────────
def show_reports():
    st.markdown("### Reports")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>Export fraud detection reports</p>", unsafe_allow_html=True)

    data = api_get("reports/summary")
    if data is None or not data.get("loaded"):
        st.info("No report data available. Load data from the **Upload Transactions** page first.")
        return

    # Summary cards
    st.markdown("##### Summary")
    s1, s2, s3, s4 = st.columns(4)
    s1.metric("Total Transactions", f"{data['total']:,}")
    s2.metric("Fraud Detected", f"{data['fraud']:,}")
    s3.metric("Legitimate", f"{data['legitimate']:,}")
    s4.metric("Avg Risk Score", data["avg_risk_score"])

    st.write("")

    # Metrics table
    m = data.get("metrics", {})
    if m:
        st.markdown("##### Performance Metrics")
        metrics_df = pd.DataFrame([
            {"Metric": k.replace("_", " ").title(), "Value": v} for k, v in m.items()
        ])
        st.dataframe(metrics_df, use_container_width=True, hide_index=True)

    # Confusion matrix summary
    cm = data.get("confusion")
    if cm:
        st.markdown("##### Confusion Matrix")
        cm_df = pd.DataFrame([
            {"": "Actual Legit", "Predicted Legit": f"TN: {cm['tn']:,}", "Predicted Fraud": f"FP: {cm['fp']:,}"},
            {"": "Actual Fraud", "Predicted Legit": f"FN: {cm['fn']:,}", "Predicted Fraud": f"TP: {cm['tp']:,}"},
        ])
        st.dataframe(cm_df, use_container_width=True, hide_index=True)

    st.write("")
    st.markdown("##### Download Reports")

    d1, d2, d3 = st.columns(3)

    # Download PDF
    with d1:
        if st.button("📄 Download Full Report (PDF)", use_container_width=True):
            try:
                r = requests.get(f"{BACKEND}/reports/pdf", timeout=60)
                if r.status_code == 200:
                    st.download_button(
                        "⬇ Save PDF",
                        data=r.content,
                        file_name="fraudshield_report.pdf",
                        mime="application/pdf",
                        use_container_width=True,
                    )
                else:
                    st.error("Failed to generate PDF.")
            except Exception as e:
                st.error(f"Error: {e}")

    # Download Metrics CSV
    with d2:
        if st.button("📊 Download Metrics (CSV)", use_container_width=True):
            try:
                r = requests.get(f"{BACKEND}/reports/metrics-csv", timeout=30)
                if r.status_code == 200:
                    st.download_button(
                        "⬇ Save Metrics CSV",
                        data=r.content,
                        file_name="fraudshield_metrics.csv",
                        mime="text/csv",
                        use_container_width=True,
                    )
                else:
                    st.error("Failed to download metrics.")
            except Exception as e:
                st.error(f"Error: {e}")

    # Download Transactions CSV
    with d3:
        if st.button("📋 Download Transactions (CSV)", use_container_width=True):
            try:
                r = requests.get(f"{BACKEND}/reports/transactions-csv", timeout=60)
                if r.status_code == 200:
                    st.download_button(
                        "⬇ Save Transactions CSV",
                        data=r.content,
                        file_name="fraudshield_transactions.csv",
                        mime="text/csv",
                        use_container_width=True,
                    )
                else:
                    st.error("Failed to download transactions.")
            except Exception as e:
                st.error(f"Error: {e}")


# ─────────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────────
def show_settings():
    st.markdown("### Settings")
    st.markdown("<p style='color:#64748b;margin-top:-10px;'>Configure FraudShield AI Platform</p>", unsafe_allow_html=True)

    current = api_get("settings")
    if current is None:
        st.error("Cannot load settings from backend.")
        return

    st.markdown("##### Model Configuration")

    c1, c2 = st.columns(2)
    with c1:
        threshold = st.slider(
            "Fraud Detection Threshold",
            min_value=0.1, max_value=0.9, value=float(current.get("threshold", 0.5)), step=0.05,
            help="Transactions with risk scores above this threshold are flagged as fraud.",
        )
    with c2:
        spw = st.number_input(
            "Scale Pos Weight",
            min_value=1.0, max_value=200.0, value=float(current.get("scale_pos_weight", 50)), step=5.0,
            help="Adjusts sensitivity to the minority class (fraud). Higher = more aggressive fraud detection.",
        )

    auto_detect = st.checkbox(
        "Auto-detect fraud on upload",
        value=current.get("auto_detect", True),
        help="Automatically run fraud detection when a CSV file is uploaded.",
    )

    st.write("")
    st.markdown("##### System Information")
    st.markdown(f"- **Model Type**: {current.get('model_type', 'XGBoost')}")
    st.markdown(f"- **Backend URL**: `{BACKEND}`")
    st.markdown(f"- **Current Threshold**: `{current.get('threshold', 0.5)}`")

    st.write("")
    if st.button("💾 Save Settings", type="primary"):
        result = api_post("settings", json={
            "threshold": threshold,
            "scale_pos_weight": spw,
            "auto_detect": auto_detect,
        })
        if result and result.get("status") == "updated":
            st.success("Settings saved successfully!")
            st.json(result["settings"])
        elif result:
            st.error(result.get("error", "Failed to save settings."))


# ─────────────────────────────────────────────
# SIDEBAR NAVIGATION
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="background:#3b82f6;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">🛡️</div>
        <div>
            <h2 style='margin:0;color:white;font-size:1.2rem;'>FraudShield</h2>
            <div style='font-size:0.7rem;color:#94a3b8;letter-spacing:1px;'>AI PLATFORM</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<span style='color:#64748b;font-size:0.75rem;font-weight:600;letter-spacing:1px;margin-left:5px;margin-bottom:10px;display:block;'>NAVIGATION</span>", unsafe_allow_html=True)

    page = st.radio(
        "",
        options=["Dashboard", "Upload Transactions", "Fraud Analysis", "Model Insights", "Reports", "Settings"],
        label_visibility="collapsed",
    )

if page == "Dashboard":
    show_dashboard()
elif page == "Upload Transactions":
    show_upload()
elif page == "Fraud Analysis":
    show_fraud_analysis()
elif page == "Model Insights":
    show_model_insights()
elif page == "Reports":
    show_reports()
elif page == "Settings":
    show_settings()
