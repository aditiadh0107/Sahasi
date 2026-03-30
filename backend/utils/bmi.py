"""
BMI calculation utilities
"""

def calculate_bmi(weight: float, height: float) -> float:
    """
    Calculate BMI from weight and height
    Args:
        weight: Weight in kg
        height:  Height in cm
    Returns:
        BMI value
    """
    height_m = height / 100  # Convert cm to meters
    return weight / (height_m * height_m)

def get_category_from_bmi(bmi: float) -> int:
    """
    Get BMI category (1 or 2)
    Category 1: BMI < 25
    Category 2: BMI >= 25
    """
    if bmi < 25:
        return 1
    else:
        return 2
