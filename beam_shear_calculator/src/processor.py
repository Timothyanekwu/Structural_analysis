from models import BeamConfig
from models import Load
from models import Support

# Merges multiple loads that share the same position into a single combined load (sum of magnitudes). Returns a cleaned list.
def combine_loads_at_same_position(loads: list[Load]) -> list[Load]:
    pass

# Description:
# Computes piecewise shear force along the beam.
# Process:

# Combine loads + supports into a single list of “forces”

# Sort forces by position

# Walk from left to right, applying each force to update the running shear

# Produce segments in form:

# (start_x, end_x, shear_value)
def compute_shear_segments(
        beam: BeamConfig,
        loads: list[Load],
        supports: list[Support]
    ) -> list[tuple[float, float, float]]:
        pass