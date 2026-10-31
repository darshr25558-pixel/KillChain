## install node modules in client folder
cd client && npm install
## install python dependencies in backend folder
cd ../backend 
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
