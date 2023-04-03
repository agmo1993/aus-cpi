# Project Name

[Project description]

## Table of Contents

- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Built With](#built-with)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Python [version]
- Node.js [version]
- Docker [>=20.10.17] 
- Sqitch [version]

### Installing

1. Clone the repo

```
git clone [repository url]
```

2. Install the backend dependencies

```
cd backend
pip install -r requirements.txt
```

3. Install the frontend dependencies

```
cd frontend
npm install
```

4. Create a .env file in the root directory and fill in the required environment variables

```
DB_HOST=[database host]
DB_PORT=[database port]
DB_NAME=[database name]
DB_USER=[database user]
DB_PASSWORD=[database password]
```


## Development

1. Start the backend server / database running on Docker

```sh
. .env
docker run -d \
  --name ${DB_NAME} \
  -e POSTGRES_USER=${DB_USER} \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -e POSTGRES_DB=auscpidb \
  -p 5432:5432 \
  kartoza/postgis:14-3.3
```

Run the database migrations using sqitch

```sh
cd backend
sqitch deploy
```

Run the data extraction scripts, which should create four csv files in the `./data` directory.

```
python extract_monthly.py
python extract_quarterly.py
```

Insert the data into the database tables,

```sh
python inserts_lookup_table.py
python inserts.py
```

These should fill the database tables, as well as the dependent materialized views with the data required to run
the application. 

2. Start the frontend server

```
cd frontend
npm run dev
```

3. Open http://localhost:3000 in your browser

## Testing (TODO)

Todo : Explain how to run the automated tests for this system

### Unit Tests (TODO)

### Integration Tests (TODO)

## Built With

- Python [version] - Backend language
- Next.js [version] - Frontend framework
- PostgreSQL [version] - Database

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the [LICENSE NAME] License - see the [LICENSE.md](LICENSE.md) file for details.


