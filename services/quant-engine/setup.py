from setuptools import find_packages, setup

setup(name="thequantbateman-quant-engine", version="0.1.0", packages=find_packages(), install_requires=["fastapi==0.116.1", "numpy==2.0.2", "pydantic==2.11.7", "scipy==1.13.1", "uvicorn[standard]==0.35.0"])
