from models import BeamConfig
from models import Load
from models import Support

# Validates inputs
def validate_inputs(beam_length, raw_supports, raw_loads):
    validate_beamLength(beam_length)
    validate_raw_loads_or_supports(raw_loads)
    validate_raw_loads_or_supports(raw_supports)
    validate_at_least_one_force(raw_loads,raw_supports)
    validate_positions_within_beam(beam_length, raw_loads)
    validate_positions_within_beam(beam_length, raw_supports)
    validate_nonzero_magnitudes(raw_loads)
    validate_nonzero_magnitudes(raw_supports)

def validate_beamLength(length):
    if not isinstance(length, (int,float)):
        raise TypeError("Beam Length must be numeric")
def validate_raw_loads_or_supports(raw_loads):
    """
    Validates if the input is a list of (position, magnitude) pairs 
    where both values are numeric.
    Raises descriptive exceptions if invalid.
    """
    if not isinstance(raw_loads, list):
        raise TypeError(f"Input must be a list of pairs, not {type(raw_loads).__name__}.")
    for i,item in enumerate(raw_loads):
        if not isinstance(item, tuple):
                raise TypeError(f"Item at index {i} must be a tuple (position, magnitude), not of type: {type(item).__name__}.")
        if len(item) != 2:
            raise ValueError(f"Item at index {i} must have exactly 2 elements. Found {len(item)}.")
        position, magnitude = item
        if not isinstance(position, (int, float)) or not isinstance(magnitude, (int,float)):
            raise ValueError(
                f"Item at index {i} contains non-numeric values. "
                                f"Position type: {type(position).__name__}, "
                                f"Magnitude type: {type(magnitude).__name__}."
            )

# Description
# Ensures every load and support has a position between 0 and beam_length.
# Raises an error if any position is outside this range.
def validate_positions_within_beam(beam_length: float,
                                raw_loads_or_supports: list) -> None:
    for i,item in enumerate(raw_loads_or_supports):
        position, *_ = item
        if not (0 <= position <= beam_length):
            raise ValueError("Position must be within beam length")

# Description
# Checks that every load and support has a magnitude ≠ 0.
# Raises an error if any magnitude is zero.
def validate_nonzero_magnitudes(raw_loads_or_supports: list) -> None:
    for i,item in enumerate(raw_loads_or_supports):
        _, magnitude = item
        if not (magnitude):
            raise ValueError("Magnitude must not 0")

# Description
# Confirms that the user supplied at least one load or support.
# Raises an error if both lists are empty.
def validate_at_least_one_force(raw_loads: list, raw_supports: list) -> None:
    if not raw_supports and not raw_loads:
        raise ValueError("There must be at least one force acting on the Beam")