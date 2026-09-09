from io import BytesIO 

import pandas as pd 

def read_dataset(filename : str, content : bytes) -> pd.DataFrame : 
    extension = filename.rsplit(".", 1)[-1].lower() 

    if extension == "csv" : 
        return pd.read_csv(BytesIO(content)) 

    if extension in {"xlsx", "xls"} : 
        return pd.read_excel(BytesIO(content)) 

    raise ValueError("Unsupported file type. Use CSV or Excel.") 