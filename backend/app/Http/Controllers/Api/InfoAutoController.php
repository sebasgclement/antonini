<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InfoAutoService;
use Illuminate\Http\Request;

class InfoAutoController extends Controller
{
    protected $service;

    public function __construct(InfoAutoService $service)
    {
        $this->service = $service;
    }

    public function getBrands()
    {
        return response()->json($this->service->getBrands());
    }

    public function getGroups($brandId)
    {
        return response()->json($this->service->getGroups($brandId));
    }

    // Ahora recibimos $brandId y $groupId
    public function getModels($brandId, $groupId)
    {
        return response()->json($this->service->getModels($brandId, $groupId));
    }

    public function getModelDetail($codia)
    {
        // Endpoint: GET /api/infoauto/models/{codia}
        return response()->json($this->service->getModelDetail($codia));
    }

    public function getPrices($codia)
    {
        return response()->json($this->service->getPrices($codia));
    }
}