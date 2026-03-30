"""
Code generation utilities
"""
import random
import string

def generate_unique_six_digit_code() -> str:
    """Generate a random 6-digit code"""
    return ''.join(random.choices(string.digits, k=6))
