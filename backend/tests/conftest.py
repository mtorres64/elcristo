import pytest
from motor.motor_asyncio import AsyncIOMotorClient

TEST_MONGO_URL = "mongodb://localhost:27017"
TEST_DB_NAME = "tienda_test_db"


@pytest.fixture(scope="session")
def mongo_client():
    client = AsyncIOMotorClient(TEST_MONGO_URL)
    yield client
    client.close()


@pytest.fixture
async def db(mongo_client):
    database = mongo_client[TEST_DB_NAME]
    yield database
    # Limpiar todas las colecciones después de cada test
    for col in await database.list_collection_names():
        await database[col].delete_many({})
