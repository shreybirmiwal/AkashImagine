# app.py
import streamlit as st
from transformers import AutoModelForCausalLM, AutoTokenizer

@st.cache_resource
def load_model():
    model_id = "ModelSpace/GemmaX2-28-9B-v0.1"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)
    return model, tokenizer

def main():
    st.title("LLM Translation App")
    st.markdown("Powered by GemmaX2-28-9B-v0.1")

    # Language selection
    col1, col2 = st.columns(2)
    with col1:
        src_lang = st.text_input("Source Language", "Chinese")
    with col2:
        tgt_lang = st.text_input("Target Language", "English")

    # Text input
    text = st.text_area("Enter text to translate", "我爱机器翻译")

    if st.button("Translate"):
        with st.spinner("Translating..."):
            try:
                model, tokenizer = load_model()
                prompt = f"Translate this from {src_lang} to {tgt_lang}:\n{src_lang}: {text}\n{tgt_lang}:"
                
                inputs = tokenizer(prompt, return_tensors="pt")
                outputs = model.generate(**inputs, max_new_tokens=512)
                
                decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
                translation = decoded.split(f"{tgt_lang}:")[-1].strip()
                
                st.success("Translation:")
                st.write(translation)
            except Exception as e:
                st.error(f"Error during translation: {str(e)}")

if __name__ == "__main__":
    main()