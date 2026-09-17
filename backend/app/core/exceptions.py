from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DatasetNotFoundError(Exception):
    """The dataset ID doesn't exist."""
    pass


class UnsupportedFileTypeError(Exception):
    """The uploaded file isn't a CSV or Excel file."""
    pass


class InvalidDatasetError(Exception):
    """The file couldn't be read as a table (corrupt, empty, malformed)."""
    pass


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DatasetNotFoundError)
    async def _not_found(request: Request, exc: DatasetNotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc) or "Dataset not found."},
        )

    @app.exception_handler(UnsupportedFileTypeError)
    async def _bad_file_type(request: Request, exc: UnsupportedFileTypeError):
        return JSONResponse(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            content={"detail": str(exc) or "Unsupported file type."},
        )

    @app.exception_handler(InvalidDatasetError)
    async def _invalid_dataset(request: Request, exc: InvalidDatasetError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": str(exc) or "The file could not be processed."},
        )