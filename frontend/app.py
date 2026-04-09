import streamlit as st
import requests
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="FraudShield AI", layout="wide", page_icon="🛡️")

# Custom CSS for shadcn-like design
st.markdown("""
<style>
    /* Styling to match the dark sleek React UI */
    .stApp {
        background-color: #f8fafc;
        color: #0f172a;
    }
    
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #0f172a;
    }
    [data-testid="stSidebarNav"] {
        display: none;
    }
    
    /* Metric Cards */
    [data-testid="stMetricValue"] {
        font-size: 1.8rem;
        font-weight: bold;
    }
    
    /* Headers */
    h1, h2, h3 {
        font-family: 'Inter', sans-serif;
    }
    
    .confusion-container {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
        text-align: center;
        max-width: 500px;
        margin: 0 auto;
    }
    .confusion-box {
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
    }
    .confusion-tn { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
    .confusion-fp { background-color: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); }
    .confusion-fn { background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
    .confusion-tp { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
    
</style>
""", unsafe_allow_html=True)


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")

def show_dashboard():
    st.markdown("### Dashboard")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>Real-time fraud detection overview</p>", unsafe_allow_html=True)
    
    # Mock data to match screenshots exactly
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("TOTAL TRANSACTIONS", "568,630")
    with col2:
        st.metric("FRAUD DETECTED", "292,959")
    with col3:
        st.metric("LEGITIMATE", "275,671")
    with col4:
        st.metric("AVG RISK SCORE", "0.5049")

    st.write("")
    
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("ACCURACY", "0.985")
    c2.metric("PRECISION", "0.970")
    c3.metric("RECALL", "1.000")
    c4.metric("F1 SCORE", "0.985")
    c5.metric("ROC-AUC", "0.985")

    st.write("")
    
    row2_col1, row2_col2 = st.columns(2)
    with row2_col1:
        st.markdown("##### Fraud vs Legitimate Distribution")
        # Donut chart
        fig = go.Figure(data=[go.Pie(labels=['Fraud', 'Legitimate'], 
                                     values=[292959, 275671], 
                                     hole=.5,
                                     marker_colors=['#ef4444', '#10b981'])])
        fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=350)
        st.plotly_chart(fig, use_container_width=True)

    with row2_col2:
        st.markdown("##### Risk Score Distribution")
        buckets = ['0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0']
        counts = [160000, 118000, 2000, 130000, 160000]
        fig2 = go.Figure(data=[go.Bar(x=buckets, y=counts, marker_color='#2563eb')])
        fig2.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=350)
        st.plotly_chart(fig2, use_container_width=True)

def show_upload():
    st.markdown("### Upload Transactions")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>Upload CSV data for fraud detection</p>", unsafe_allow_html=True)
    
    uploaded_file = st.file_uploader("Drop CSV file here or click to browse", type="csv", help="Required column: Amount. Optional: Time, V1-V28, Class")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        load_sample = st.button("Load Sample Dataset", use_container_width=True)
    with col2:
        run_fraud = st.button("Run Fraud Detection", type="primary", use_container_width=False)
        
    if load_sample or run_fraud:
        st.write("")
        c1, c2 = st.columns(2)
        c1.metric("FRAUD DETECTED", "292,856", delta_color="inverse")
        c2.metric("LEGITIMATE", "275,774", delta_color="normal")
        
        st.markdown("##### Dataset Preview (50 of 568630 rows)")
        
        mock_df = pd.DataFrame({
            'ID': [f'TXN-{i:06d}' for i in range(1, 6)],
            'Amount': ['$17982.10', '$320.50', '$89.00', '$450.25', '$12000.00'],
            'Time': ['0s', '1s', '2s', '5s', '10s'],
            'Prediction': ['Legitimate', 'Legitimate', 'Legitimate', 'Legitimate', 'Fraud'],
            'Risk Score': [0.1722, 0.05, 0.01, 0.22, 0.98]
        })
        st.dataframe(mock_df, use_container_width=True, hide_index=True)


def show_fraud_analysis():
    st.markdown("### Fraud Analysis")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>Evaluate individual transactions via API</p>", unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        amount = st.number_input("Amount ($)", min_value=0.0, value=120.50, step=10.0)
    with col2:
        time = st.number_input("Time (Hour 0-23)", min_value=0, max_value=23, value=14)
    with col3:
        transaction_type = st.number_input("Transaction Type (0-4)", min_value=0, max_value=4, value=2)
    with col4:
        location = st.number_input("Location ID (0-50)", min_value=0, max_value=50, value=15)

    if st.button("Evaluate Transaction", type="primary"):
        payload = {
            "amount": amount,
            "time": time,
            "transaction_type": transaction_type,
            "location": location
        }
        
        with st.spinner("Analyzing transaction..."):
            try:
                response = requests.post(f"{BACKEND_URL}/predict", json=payload)
                response.raise_for_status()
                result = response.json()
                
                if "error" in result:
                    st.error(result["error"])
                else:
                    prob = result['probability']
                    risk = result['risk_level']
                    
                    if risk == "LOW":
                        color = "#10b981" # Green
                    elif risk == "MEDIUM":
                        color = "#f59e0b" # Yellow
                    else:
                        color = "#ef4444" # Red
                        
                    st.markdown(f"<h2 style='text-align: center; color: {color};'>Risk Level: {risk}</h2>", unsafe_allow_html=True)
                    st.markdown(f"<p style='text-align: center;'>Fraud Probability: <strong>{prob:.2%}</strong></p>", unsafe_allow_html=True)
                    
                    if result['fraud'] == 1:
                        st.error("🚨 ALERT: High probability of fraud detected! Block transaction.")
                    else:
                        st.success("✅ Transaction verified. Normal activity.")
                    
            except requests.exceptions.ConnectionError:
                st.error(f"Failed to connect to backend at {BACKEND_URL}. Ensure it is running.")
            except Exception as e:
                st.error(f"An error occurred: {e}")

def show_model_insights():
    st.markdown("### Model Insights")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>XGBoost model performance and feature analysis</p>", unsafe_allow_html=True)
    
    st.markdown("##### Feature Importance (XGBoost)")
    features = ['V2', 'Time', 'V9', 'V11', 'V16', 'V1', 'V7', 'V3', 'Amount', 'V4', 'V17', 'V10', 'V12', 'V14']
    importance = [0.01, 0.02, 0.03, 0.035, 0.045, 0.048, 0.051, 0.07, 0.075, 0.08, 0.09, 0.13, 0.14, 0.18]
    fig = px.bar(x=importance, y=features, orientation='h', color_discrete_sequence=['#2563eb'])
    fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), height=400, xaxis_title="", yaxis_title="")
    st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("##### Confusion Matrix")
    
    # HTML Injection for confusion matrix matching the screenshot
    cm_html = """
    <div class="confusion-container">
        <div></div>
        <div style="color: #64748b; font-weight: bold; padding: 10px;">Predicted Legit</div>
        <div style="color: #64748b; font-weight: bold; padding: 10px;">Predicted Fraud</div>
        
        <div style="color: #64748b; font-weight: bold; align-self: center; text-align: right; padding-right: 15px;">Actual Legit</div>
        <div class="confusion-box confusion-tn">
            <div style="font-size: 0.8rem; color: #64748b;">TN</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">275774</div>
        </div>
        <div class="confusion-box confusion-fp">
            <div style="font-size: 0.8rem; color: #64748b;">FP</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">8541</div>
        </div>
        
        <div style="color: #64748b; font-weight: bold; align-self: center; text-align: right; padding-right: 15px;">Actual Fraud</div>
        <div class="confusion-box confusion-fn">
            <div style="font-size: 0.8rem; color: #64748b;">FN</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">0</div>
        </div>
        <div class="confusion-box confusion-tp">
            <div style="font-size: 0.8rem; color: #64748b;">TP</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">284315</div>
        </div>
    </div>
    """
    st.markdown(cm_html, unsafe_allow_html=True)
    
    st.write("")
    st.info("**Cost-Sensitive Learning (scale_pos_weight = 50)**\n\nThe model uses scale_pos_weight = 50 to address class imbalance. This penalizes false negatives (missed fraud) 50× more than false positives, resulting in high recall at the cost of lower precision. This is ideal for fraud detection where missing fraudulent transactions is far more costly than flagging legitimate ones for review.")

def show_reports():
    st.markdown("### Reports")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>Export generated reports</p>", unsafe_allow_html=True)
    st.info("Feature in development.")

def show_settings():
    st.markdown("### Settings")
    st.markdown("<p style='color: #64748b; margin-top: -10px;'>Configure FraudShield AI Platform</p>", unsafe_allow_html=True)
    st.info("Feature in development.")


# Sidebar Navigation
with st.sidebar:
    st.markdown(
        """
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="background-color: #3b82f6; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                🛡️
            </div>
            <div>
                <h2 style='margin: 0; color: white; font-size: 1.2rem;'>FraudShield</h2>
                <div style='font-size: 0.7rem; color: #94a3b8; letter-spacing: 1px;'>AI PLATFORM</div>
            </div>
        </div>
        """, 
        unsafe_allow_html=True
    )
    
    st.markdown("<span style='color: #64748b; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; margin-left: 5px; margin-bottom: 10px; display: block;'>NAVIGATION</span>", unsafe_allow_html=True)
    
    page = st.radio(
        "", 
        options=["Dashboard", "Upload Transactions", "Fraud Analysis", "Model Insights", "Reports", "Settings"],
        label_visibility="collapsed"
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
