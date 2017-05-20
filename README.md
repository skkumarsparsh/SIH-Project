# SIH-Project

This project was made for the Smart India Hackathon 2017 for the Ministry of Steel. We had the objective of not storing any data on the local device accessing the database, in this case, MongoDB.

We implemented this by including HTTP headers in our JavaScript server side code to instruct the browser to not store any cache. Right-click and CTRL C was also disabled on the page showing the data. We additionally encrypted all the entries in the database using AES 256 encryption for improved security. Decryption happens only when the database table is requested with the proper credentials. We also implemented a simple login system using sessions. 

Lastly, we implemented Google's Material Design Library into our HTML code to provide a nice UI to the user. All this was done within a span of 36hrs.
